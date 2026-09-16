-- ============================================================================
-- Migration 036: Registration and Avatar Cleanup
-- Description: Drop avatar_initials from clinicians and patients tables.
-- Drop full_name from applications and add first_name and last_name.
-- Recreate summary views without avatar_initials and without the computed 'name' column.
-- Update handle_application_approval trigger for the new application schema.
-- ============================================================================

-- 1. Applications Table Updates
ALTER TABLE public.applications DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '';

-- 2. Drop Views that depend on avatar_initials or full_name
DROP VIEW IF EXISTS public.clinician_summary CASCADE;
DROP VIEW IF EXISTS public.patient_summary CASCADE;

-- 3. Clinicians and Patients Tables Updates
ALTER TABLE public.clinicians DROP COLUMN IF EXISTS avatar_initials;
ALTER TABLE public.patients DROP COLUMN IF EXISTS avatar_initials;

-- 4. Recreate clinician_summary
CREATE OR REPLACE VIEW public.clinician_summary AS
SELECT
  up.id,
  up.email,
  up.first_name,
  up.last_name,
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

-- 5. Recreate patient_summary
CREATE OR REPLACE VIEW public.patient_summary AS
SELECT
  up.id,
  up.email,
  up.first_name,
  up.last_name,
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

-- 5.5 Recreate alert_with_patient_name to remove the 'patient_name' dependency if we wanted, or just keep it for backward compatibility but fix the concatenation.
-- Actually we should explicitly map first_name and last_name since we want the frontend to use them.
DROP VIEW IF EXISTS public.alert_with_patient_name CASCADE;
CREATE OR REPLACE VIEW public.alert_with_patient_name AS
SELECT
  a.*,
  up.first_name AS patient_first_name,
  up.last_name AS patient_last_name
FROM public.alerts a
JOIN public.users_profile up ON up.id = a.patient_id;

-- 6. Update the Trigger Function for Application Approvals (Migration 034 dependency)
CREATE OR REPLACE FUNCTION public.handle_application_approval()
RETURNS trigger AS $$
BEGIN
  -- If status changes to 'approved', provision the user
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- 1. Create or Update users_profile
    INSERT INTO public.users_profile (
      id, email, first_name, last_name, role, auth_provider
    )
    VALUES (
      gen_random_uuid(), -- temporary ID until Google Auth links it
      NEW.email,
      NEW.first_name,
      NEW.last_name,
      'clinician',
      'email'
    )
    ON CONFLICT (email) DO UPDATE SET 
      role = 'clinician',
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name;

    -- 2. Create the clinician professional record
    INSERT INTO public.clinicians (
      user_id, specialty, institution, ahpra_number, status
    )
    SELECT id, NEW.specialty, NEW.institution, NEW.ahpra_number, 'active'
    FROM public.users_profile
    WHERE email = NEW.email
    ON CONFLICT (user_id) DO UPDATE SET
      specialty = EXCLUDED.specialty,
      institution = EXCLUDED.institution,
      ahpra_number = EXCLUDED.ahpra_number,
      status = 'active';

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
