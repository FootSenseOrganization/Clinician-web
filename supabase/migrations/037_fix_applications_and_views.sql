-- ============================================================================
-- Migration 037: Fix Applications Approval, Status Lookup & Views Compatibility
-- Description:
-- 0. Drop legacy users_profile_id_fkey constraint so clinicians can be pre-provisioned.
-- 1. Fix application approval & automated provisioning for users_profile and clinicians.
-- 2. Provide SECURITY DEFINER RPC functions: approve_application and decline_application.
-- 3. Provide SECURITY DEFINER RPC function: lookup_application_status for applicants.
-- 4. Re-attach on_application_approved trigger on public.applications.
-- 5. Allow applications table SELECT and UPDATE so admins and applicants can interact smoothly.
-- 6. Restore backward-compatible computed 'name' and 'patient_name' columns on summary views.
-- 7. Explicit permissions and reload PostgREST schema cache.
-- ============================================================================

-- 0. Drop the legacy foreign key constraint on users_profile.id referencing auth.users(id).
-- In Migration 033, auth_id was added to map Google Auth ID to the existing profile,
-- but the legacy constraint users_profile_id_fkey was blocking pre-provisioning approved users.
ALTER TABLE public.users_profile DROP CONSTRAINT IF EXISTS users_profile_id_fkey;

-- Ensure auth_id references auth.users cleanly if desired
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_profile_auth_id_fkey'
  ) THEN
    ALTER TABLE public.users_profile
      ADD CONSTRAINT users_profile_auth_id_fkey
      FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 1. Applications Table RLS Policies
DROP POLICY IF EXISTS "View applications (Clinician, Admin)" ON public.applications;
DROP POLICY IF EXISTS "View applications" ON public.applications;
DROP POLICY IF EXISTS "applications_select_all" ON public.applications;

CREATE POLICY "View applications" ON public.applications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Update applications (Admin)" ON public.applications;
DROP POLICY IF EXISTS "Update applications" ON public.applications;
DROP POLICY IF EXISTS "applications_update" ON public.applications;

CREATE POLICY "Update applications" ON public.applications
  FOR UPDATE USING (true);

-- 2. Trigger Function: Automatically provision user + clinician when status becomes 'approved'
CREATE OR REPLACE FUNCTION public.handle_application_approval()
RETURNS trigger AS $$
DECLARE
  target_id UUID;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Check if user already exists in users_profile
    SELECT id INTO target_id FROM public.users_profile WHERE email = NEW.email LIMIT 1;

    IF target_id IS NULL THEN
      target_id := gen_random_uuid();
      INSERT INTO public.users_profile (
        id, email, first_name, last_name, role, auth_provider
      ) VALUES (
        target_id,
        NEW.email,
        COALESCE(NEW.first_name, ''),
        COALESCE(NEW.last_name, ''),
        'clinician',
        'google'
      );
    ELSE
      UPDATE public.users_profile
      SET role = 'clinician',
          first_name = COALESCE(NULLIF(NEW.first_name, ''), first_name),
          last_name = COALESCE(NULLIF(NEW.last_name, ''), last_name)
      WHERE id = target_id;
    END IF;

    -- Create or update the clinician record
    INSERT INTO public.clinicians (
      user_id, specialty, institution, ahpra_number, status
    ) VALUES (
      target_id,
      NEW.specialty,
      NEW.institution,
      NEW.ahpra_number,
      'active'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      specialty = EXCLUDED.specialty,
      institution = EXCLUDED.institution,
      ahpra_number = EXCLUDED.ahpra_number,
      status = 'active';

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reattach the trigger to applications table
DROP TRIGGER IF EXISTS on_application_approved ON public.applications;
CREATE TRIGGER on_application_approved
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_application_approval();

-- 3. Dedicated RPC: approve_application (Atomic, provisions users_profile + clinicians)
CREATE OR REPLACE FUNCTION public.approve_application(app_id UUID, reviewer_id UUID DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_record RECORD;
  target_id UUID;
BEGIN
  -- Find application
  SELECT * INTO app_record FROM public.applications WHERE id = app_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found with id %', app_id;
  END IF;

  -- Update application table
  UPDATE public.applications
  SET status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = reviewer_id,
      decline_reason = NULL
  WHERE id = app_id;

  -- Provision user in users_profile
  SELECT id INTO target_id FROM public.users_profile WHERE email = app_record.email LIMIT 1;
  IF target_id IS NULL THEN
    target_id := gen_random_uuid();
    INSERT INTO public.users_profile (
      id, email, first_name, last_name, role, auth_provider
    ) VALUES (
      target_id,
      app_record.email,
      COALESCE(app_record.first_name, ''),
      COALESCE(app_record.last_name, ''),
      'clinician',
      'google'
    );
  ELSE
    UPDATE public.users_profile
    SET role = 'clinician',
        first_name = COALESCE(NULLIF(app_record.first_name, ''), first_name),
        last_name = COALESCE(NULLIF(app_record.last_name, ''), last_name)
    WHERE id = target_id;
  END IF;

  -- Provision clinician record
  INSERT INTO public.clinicians (
    user_id, specialty, institution, ahpra_number, status
  ) VALUES (
    target_id,
    app_record.specialty,
    app_record.institution,
    app_record.ahpra_number,
    'active'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    specialty = EXCLUDED.specialty,
    institution = EXCLUDED.institution,
    ahpra_number = EXCLUDED.ahpra_number,
    status = 'active';

  RETURN jsonb_build_object('success', true, 'user_id', target_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_application(UUID, UUID) TO authenticated, anon, service_role;

-- 4. Dedicated RPC: decline_application
CREATE OR REPLACE FUNCTION public.decline_application(app_id UUID, reason TEXT DEFAULT NULL, reviewer_id UUID DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.applications
  SET status = 'declined',
      reviewed_at = NOW(),
      reviewed_by = reviewer_id,
      decline_reason = reason
  WHERE id = app_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found with id %', app_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_application(UUID, TEXT, UUID) TO authenticated, anon, service_role;

-- 5. Dedicated RPC: lookup_application_status
CREATE OR REPLACE FUNCTION public.lookup_application_status(query_text text)
RETURNS TABLE (
  found boolean,
  status text,
  ahpra_number text,
  decline_reason text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  q text := trim(lower(query_text));
BEGIN
  -- Check clinician_summary for approved clinicians
  RETURN QUERY
  SELECT
    true AS found,
    'approved'::text AS status,
    c.ahpra_number::text,
    null::text AS decline_reason
  FROM public.clinician_summary c
  WHERE lower(c.ahpra_number) = q OR lower(c.email) = q
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  -- Check applications table for pending, approved, or declined status
  RETURN QUERY
  SELECT
    true AS found,
    a.status::text,
    a.ahpra_number::text,
    a.decline_reason::text
  FROM public.applications a
  WHERE lower(a.ahpra_number) = q OR lower(a.email) = q
  ORDER BY a.submitted_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, null::text, null::text, null::text;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_application_status(text) TO anon, authenticated, service_role;

-- 6. Restore Views with computed 'name' and 'patient_name' columns
DROP VIEW IF EXISTS public.clinician_summary CASCADE;
CREATE OR REPLACE VIEW public.clinician_summary AS
SELECT
  up.id,
  up.email,
  up.first_name,
  up.last_name,
  CONCAT(up.first_name, ' ', up.last_name) AS name,
  up.role,
  up.created_at,
  c.specialty,
  c.institution,
  c.ahpra_number,
  c.status,
  c.last_login,
  COUNT(p.user_id)::integer AS patient_count
FROM public.users_profile up
JOIN public.clinicians c ON c.user_id = up.id
LEFT JOIN public.patients p ON p.clinician_id = up.id
GROUP BY up.id, up.email, up.first_name, up.last_name, up.role, up.created_at,
         c.specialty, c.institution, c.ahpra_number, c.status, c.last_login;

DROP VIEW IF EXISTS public.patient_summary CASCADE;
CREATE OR REPLACE VIEW public.patient_summary AS
SELECT
  up.id,
  up.email,
  up.first_name,
  up.last_name,
  CONCAT(up.first_name, ' ', up.last_name) AS name,
  up.country_code,
  up.mobile_number,
  up.address,
  up.role,
  p.age,
  p.diabetes_type,
  p.diagnosis_year,
  p.clinician_id,
  p.firebase_uid,
  up.created_at,
  COALESCE(agg.total_measurements, 0)::integer       AS total_measurements,
  agg.last_measurement,
  COALESCE(latest.latest_risk_score, 0)::integer      AS latest_risk_score,
  COALESCE(latest.latest_risk_level, 'low')           AS latest_risk_level
FROM public.users_profile up
JOIN public.patients p ON p.user_id = up.id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::integer   AS total_measurements,
    MAX(m.timestamp)    AS last_measurement
  FROM public.measurements m
  WHERE m.user_id = up.id
) agg ON true
LEFT JOIN LATERAL (
  SELECT
    (m2.analysis->>'risk_score')::integer AS latest_risk_score,
    m2.analysis->>'risk_level'            AS latest_risk_level
  FROM public.measurements m2
  WHERE m2.user_id = up.id AND m2.analysis IS NOT NULL
  ORDER BY m2.timestamp DESC
  LIMIT 1
) latest ON true;

DROP VIEW IF EXISTS public.alert_with_patient_name CASCADE;
CREATE OR REPLACE VIEW public.alert_with_patient_name AS
SELECT
  a.*,
  up.first_name AS patient_first_name,
  up.last_name AS patient_last_name,
  CONCAT(up.first_name, ' ', up.last_name) AS patient_name
FROM public.alerts a
JOIN public.users_profile up ON up.id = a.patient_id;

-- 7. Explicit Permissions & Schema Cache Reload
GRANT SELECT ON public.clinician_summary TO authenticated, anon, service_role;
GRANT SELECT ON public.patient_summary TO authenticated, anon, service_role;
GRANT SELECT ON public.alert_with_patient_name TO authenticated, anon, service_role;

NOTIFY pgrst, 'reload schema';
