-- ============================================================================
-- Migration 041: Dual-Role Support (Clinician + Admin) & Promote e20069
-- Description:
-- 1. Drops destructive on_role_change trigger so promoting clinicians preserves clinical records.
-- 2. Adds is_admin column to users_profile.
-- 3. Updates get_user_role helper to support dual roles.
-- 4. Updates get_current_user_profile() RPC to return roles array & is_admin flag.
-- 5. Updates clinician_summary view to expose is_admin status.
-- 6. Adds promote_clinician_to_admin and demote_admin_to_clinician RPCs.
-- 7. Promotes e20069@eng.pdn.ac.lk to have both Clinician & Admin roles.
-- 8. Ensures root admin foot.sense.monash@gmail.com has only Admin role.
-- ============================================================================

-- 1. Drop destructive trigger so role changes never delete clinician data
DROP TRIGGER IF EXISTS on_role_change ON public.users_profile;
DROP FUNCTION IF EXISTS public.handle_role_change();

-- 2. Ensure is_admin column and admins table exist
ALTER TABLE public.users_profile ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.admins (
  user_id     UUID PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
  permissions JSONB,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View admins (Admin)" ON public.admins;
CREATE POLICY "View admins (Admin)" ON public.admins
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Manage admins (Admin)" ON public.admins;
CREATE POLICY "Manage admins (Admin)" ON public.admins
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- 3. Update get_user_role helper to recognize both users_profile.is_admin and admins table
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
#variable_conflict use_column
DECLARE
  v_pid UUID := public.get_auth_profile_id(get_user_role.user_id);
  v_is_admin BOOLEAN := FALSE;
  v_role TEXT;
  v_clinician_status TEXT;
BEGIN
  SELECT up.role, COALESCE(up.is_admin, false) INTO v_role, v_is_admin 
  FROM public.users_profile up WHERE up.id = v_pid;
  
  IF v_role = 'admin' OR v_is_admin OR EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = v_pid) THEN
    RETURN 'admin';
  END IF;

  SELECT c.status INTO v_clinician_status FROM public.clinicians c WHERE c.user_id = v_pid LIMIT 1;
  IF v_clinician_status = 'suspended' THEN
    RETURN 'suspended';
  END IF;
  
  IF v_role = 'clinician' OR v_clinician_status = 'active' THEN
    RETURN 'clinician';
  END IF;
  
  RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Update clinician_summary view to include is_admin flag
DROP VIEW IF EXISTS public.clinician_summary CASCADE;
CREATE OR REPLACE VIEW public.clinician_summary AS
SELECT
  up.id,
  up.email,
  up.first_name,
  up.last_name,
  CONCAT(up.first_name, ' ', up.last_name) AS name,
  up.role,
  (COALESCE(up.is_admin, false) OR EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = up.id)) AS is_admin,
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
GROUP BY up.id, up.email, up.first_name, up.last_name, up.role, up.is_admin, up.created_at,
         c.specialty, c.institution, c.ahpra_number, c.status, c.last_login;

-- 5. RPC: promote_clinician_to_admin (non-destructive)
CREATE OR REPLACE FUNCTION public.promote_clinician_to_admin(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM public.users_profile WHERE id = target_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Add to admins table
  INSERT INTO public.admins (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Set is_admin flag
  UPDATE public.users_profile
  SET is_admin = true, updated_at = NOW()
  WHERE id = target_user_id;

  -- Notice: public.clinicians record and assigned patients remain untouched!

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.promote_clinician_to_admin(UUID) TO authenticated, service_role;

-- 6. RPC: demote_admin_to_clinician (Only Root Admin foot.sense.monash@gmail.com can demote)
CREATE OR REPLACE FUNCTION public.demote_admin_to_clinician(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_email TEXT;
  v_caller_pid UUID;
BEGIN
  v_caller_pid := public.get_auth_profile_id(auth.uid());

  -- Verify caller is the root platform administrator
  SELECT LOWER(email) INTO v_caller_email
  FROM public.users_profile
  WHERE id = v_caller_pid;

  IF v_caller_email IS NOT NULL AND v_caller_email <> 'foot.sense.monash@gmail.com' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied: Only the root administrator (foot.sense.monash@gmail.com) can demote administrators.');
  END IF;

  -- Protect root administrator from demotion
  IF EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE id = target_user_id AND LOWER(email) = 'foot.sense.monash@gmail.com'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Root platform administrator cannot be demoted.');
  END IF;

  DELETE FROM public.admins WHERE user_id = target_user_id;
  
  UPDATE public.users_profile
  SET is_admin = false, updated_at = NOW()
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.demote_admin_to_clinician(UUID) TO authenticated, service_role;

-- 6b. RPC: set_clinician_status (Atomic update for active/suspended status)
CREATE OR REPLACE FUNCTION public.set_clinician_status(target_user_id UUID, new_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_pid UUID;
  v_caller_role TEXT;
  v_caller_email TEXT;
  v_is_admin BOOLEAN := false;
BEGIN
  v_caller_pid := public.get_auth_profile_id(auth.uid());

  SELECT LOWER(email), role, COALESCE(is_admin, false) 
  INTO v_caller_email, v_caller_role, v_is_admin
  FROM public.users_profile
  WHERE id = v_caller_pid;

  -- Check if caller is an administrator
  IF v_caller_role <> 'admin' 
     AND NOT v_is_admin 
     AND NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = v_caller_pid) 
     AND (v_caller_email IS NULL OR v_caller_email NOT IN ('foot.sense.monash@gmail.com', 'e20069@eng.pdn.ac.lk')) 
     AND public.get_user_role(auth.uid()) <> 'admin' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Permission denied: Only administrators can modify clinician account status.'
    );
  END IF;

  IF new_status NOT IN ('active', 'suspended') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status: must be active or suspended.');
  END IF;

  UPDATE public.clinicians
  SET status = new_status
  WHERE user_id = target_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_clinician_status(UUID, TEXT) TO authenticated, service_role;


-- 7. Update get_current_user_profile() RPC with multi-role resolution
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_profile RECORD;
  v_clinician RECORD;
  v_patient_count INT := 0;
  v_is_admin BOOLEAN := FALSE;
  v_is_clinician BOOLEAN := FALSE;
  v_roles TEXT[] := ARRAY[]::TEXT[];
  v_default_role TEXT := 'user';
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  
  SELECT * INTO v_profile FROM public.users_profile 
  WHERE auth_id = v_uid OR (v_email IS NOT NULL AND LOWER(email) = LOWER(v_email))
  ORDER BY (CASE WHEN auth_id = v_uid THEN 0 ELSE 1 END)
  LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Self-heal auth_id linking
  IF v_profile.auth_id IS NULL OR v_profile.auth_id != v_uid THEN
    UPDATE public.users_profile SET auth_id = v_uid, updated_at = NOW() WHERE id = v_profile.id;
  END IF;

  -- 1. Check Admin status
  IF v_profile.role = 'admin' 
     OR COALESCE(v_profile.is_admin, false) = true 
     OR EXISTS (SELECT 1 FROM public.admins WHERE user_id = v_profile.id)
     OR (v_email IS NOT NULL AND LOWER(v_email) = 'foot.sense.monash@gmail.com')
     OR (v_email IS NOT NULL AND LOWER(v_email) = 'e20069@eng.pdn.ac.lk') THEN
    v_is_admin := TRUE;
    v_roles := array_append(v_roles, 'admin');
  END IF;

  -- 2. Check Clinician status (exclude root admin foot.sense.monash@gmail.com)
  IF (v_email IS NULL OR LOWER(v_email) != 'foot.sense.monash@gmail.com') THEN
    SELECT * INTO v_clinician FROM public.clinicians WHERE user_id = v_profile.id LIMIT 1;
    IF v_clinician.user_id IS NOT NULL 
       OR v_profile.role = 'clinician' 
       OR (v_email IS NOT NULL AND LOWER(v_email) = 'e20069@eng.pdn.ac.lk') THEN
      
      -- If clinician status is suspended, REVOKE clinician role and clinical access!
      IF COALESCE(v_clinician.status, 'active') = 'suspended' THEN
        v_is_clinician := FALSE;
      ELSE
        v_is_clinician := TRUE;
        v_roles := array_append(v_roles, 'clinician');
        SELECT COUNT(*)::int INTO v_patient_count FROM public.patients WHERE clinician_id = v_profile.id;
      END IF;

      -- Update last login if clinician row exists
      IF v_clinician.user_id IS NOT NULL THEN
        UPDATE public.clinicians SET last_login = NOW() WHERE user_id = v_profile.id;
      END IF;
    END IF;
  END IF;

  -- Determine default primary role
  IF v_is_admin AND NOT v_is_clinician THEN
    v_default_role := 'admin';
  ELSIF v_is_clinician AND NOT v_is_admin THEN
    v_default_role := 'clinician';
  ELSIF v_is_admin AND v_is_clinician THEN
    v_default_role := 'admin';
  ELSIF COALESCE(v_clinician.status, 'active') = 'suspended' THEN
    v_default_role := 'suspended';
  ELSE
    v_default_role := COALESCE(v_profile.role, 'user');
  END IF;

  RETURN jsonb_build_object(
    'role', v_default_role,
    'is_admin', v_is_admin,
    'is_clinician', v_is_clinician,
    'roles', to_jsonb(v_roles),
    'user', jsonb_build_object(
      'id', v_profile.id,
      'email', v_profile.email,
      'first_name', v_profile.first_name,
      'last_name', v_profile.last_name,
      'name', CONCAT(v_profile.first_name, ' ', v_profile.last_name),
      'role', v_default_role,
      'is_admin', v_is_admin,
      'is_clinician', v_is_clinician,
      'specialty', CASE WHEN v_is_clinician THEN COALESCE(v_clinician.specialty, 'Podiatry') ELSE 'Administration' END,
      'institution', CASE WHEN v_is_clinician THEN COALESCE(v_clinician.institution, 'FootSense Clinical Health') ELSE 'FootSense' END,
      'ahpra_number', CASE WHEN v_is_clinician THEN COALESCE(v_clinician.ahpra_number, '') ELSE '' END,
      'status', CASE WHEN v_is_clinician THEN COALESCE(v_clinician.status, 'active') ELSE 'active' END,
      'last_login', NOW(),
      'patient_count', v_patient_count,
      'created_at', v_profile.created_at
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated, anon, service_role;

-- 8. Seed/Promote e20069@eng.pdn.ac.lk (Both Clinician + Admin) and configure root Admin
DO $$
DECLARE
  v_e20_id UUID;
  v_admin_id UUID;
BEGIN
  -- A. Configure e20069@eng.pdn.ac.lk with BOTH roles
  SELECT id INTO v_e20_id 
  FROM public.users_profile 
  WHERE LOWER(email) = 'e20069@eng.pdn.ac.lk' 
  LIMIT 1;

  IF v_e20_id IS NULL THEN
    v_e20_id := gen_random_uuid();
    INSERT INTO public.users_profile (
      id, email, first_name, last_name, role, is_admin, auth_provider
    )
    VALUES (
      v_e20_id, 'e20069@eng.pdn.ac.lk', 'Tharaka', 'Dilshan', 'clinician', true, 'google'
    );
  ELSE
    UPDATE public.users_profile 
    SET is_admin = true, updated_at = NOW() 
    WHERE id = v_e20_id;
  END IF;

  -- Ensure clinician record exists
  INSERT INTO public.clinicians (user_id, specialty, institution, ahpra_number, status, last_login)
  VALUES (v_e20_id, 'Podiatry', 'FootSense Clinical Health', 'MED0001234567', 'active', NOW())
  ON CONFLICT (user_id) DO UPDATE SET status = 'active';

  -- Ensure admin record exists
  INSERT INTO public.admins (user_id)
  VALUES (v_e20_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- B. Configure root admin foot.sense.monash@gmail.com with ONLY Admin role
  SELECT id INTO v_admin_id 
  FROM public.users_profile 
  WHERE LOWER(email) = 'foot.sense.monash@gmail.com' 
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO public.users_profile (
      id, email, first_name, last_name, role, is_admin, auth_provider
    )
    VALUES (
      v_admin_id, 'foot.sense.monash@gmail.com', 'Platform', 'Administrator', 'admin', true, 'google'
    );
  ELSE
    UPDATE public.users_profile 
    SET role = 'admin', is_admin = true, updated_at = NOW() 
    WHERE id = v_admin_id;
  END IF;

  -- Ensure in admins table
  INSERT INTO public.admins (user_id)
  VALUES (v_admin_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Remove root admin from clinicians table if accidentally present (only admin entry)
  DELETE FROM public.clinicians WHERE user_id = v_admin_id;

END $$;

NOTIFY pgrst, 'reload schema';
