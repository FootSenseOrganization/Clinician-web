-- ============================================================================
-- Migration 038: Self-Healing User Profile Resolution & Google Auth Linker
-- Description:
-- 1. Create SECURITY DEFINER RPC public.get_current_user_profile()
--    - Runs with elevated privileges to avoid RLS catch-22 on initial sign-in.
--    - Matches by auth.uid() OR case-insensitive email (LOWER(email) = LOWER(v_email)).
--    - Self-heals: automatically links users_profile.auth_id = auth.uid() if not yet set.
--    - Self-heals: ensures an active clinician row exists if role = 'clinician'.
--    - Returns atomic JSON payload with verified role and clinician/admin metadata.
-- 2. Update handle_new_user() trigger to use case-insensitive email matching.
-- ============================================================================

-- 1. Update trigger to link accounts case-insensitively
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
  assigned_role TEXT;
BEGIN
  -- Check if email already exists in users_profile (case-insensitive)
  SELECT id INTO existing_user_id 
  FROM public.users_profile 
  WHERE LOWER(email) = LOWER(NEW.email) 
  LIMIT 1;
  
  -- If it exists, link the new Google auth ID to the existing profile
  IF existing_user_id IS NOT NULL THEN
    UPDATE public.users_profile 
    SET auth_id = NEW.id, updated_at = NOW() 
    WHERE id = existing_user_id;
    RETURN NEW;
  END IF;

  -- Otherwise, it's a completely new user. Insert normally.
  assigned_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
  IF assigned_role NOT IN ('user', 'clinician', 'admin') THEN
    assigned_role := 'user';
  END IF;

  BEGIN
    INSERT INTO public.users_profile (
      id, auth_id, email, first_name, last_name, country_code, mobile_number, role, auth_provider
    )
    VALUES (
      NEW.id, NEW.id, LOWER(NEW.email),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'FootSense'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'country_code', ''), '+61'),
      NULLIF(NEW.raw_user_meta_data->>'mobile_number', ''),
      assigned_role,
      COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    );
  EXCEPTION
    WHEN unique_violation THEN
      UPDATE public.users_profile 
      SET auth_id = NEW.id, updated_at = NOW() 
      WHERE LOWER(email) = LOWER(NEW.email);
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Dedicated Self-Healing Profile Resolver RPC
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_profile RECORD;
  v_clinician RECORD;
  v_patient_count INT := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get authenticated user's email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  
  -- Find profile by auth_id OR case-insensitive email
  SELECT * INTO v_profile FROM public.users_profile 
  WHERE auth_id = v_uid OR (v_email IS NOT NULL AND LOWER(email) = LOWER(v_email))
  ORDER BY (CASE WHEN auth_id = v_uid THEN 0 ELSE 1 END)
  LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Self-heal: ensure auth_id is linked to current Google auth uid
  IF v_profile.auth_id IS NULL OR v_profile.auth_id != v_uid THEN
    UPDATE public.users_profile SET auth_id = v_uid, updated_at = NOW() WHERE id = v_profile.id;
  END IF;

  -- Return payload based on assigned role
  IF v_profile.role = 'clinician' THEN
    SELECT * INTO v_clinician FROM public.clinicians WHERE user_id = v_profile.id LIMIT 1;
    
    -- Self-heal missing clinician row if user was approved in users_profile
    IF v_clinician.user_id IS NULL THEN
      INSERT INTO public.clinicians (user_id, specialty, institution, ahpra_number, status, last_login)
      VALUES (v_profile.id, 'Podiatry', 'FootSense Clinical Health', '', 'active', NOW())
      RETURNING * INTO v_clinician;
    ELSE
      -- Update last login
      UPDATE public.clinicians SET last_login = NOW() WHERE user_id = v_profile.id;
    END IF;

    SELECT COUNT(*)::int INTO v_patient_count FROM public.patients WHERE clinician_id = v_profile.id;

    RETURN jsonb_build_object(
      'role', 'clinician',
      'user', jsonb_build_object(
        'id', v_profile.id,
        'email', v_profile.email,
        'first_name', v_profile.first_name,
        'last_name', v_profile.last_name,
        'name', CONCAT(v_profile.first_name, ' ', v_profile.last_name),
        'role', 'clinician',
        'specialty', COALESCE(v_clinician.specialty, 'Podiatry'),
        'institution', COALESCE(v_clinician.institution, 'FootSense Clinical Health'),
        'ahpra_number', COALESCE(v_clinician.ahpra_number, ''),
        'status', COALESCE(v_clinician.status, 'active'),
        'last_login', COALESCE(v_clinician.last_login, NOW()),
        'patient_count', v_patient_count,
        'created_at', v_profile.created_at
      )
    );

  ELSIF v_profile.role = 'admin' THEN
    RETURN jsonb_build_object(
      'role', 'admin',
      'user', jsonb_build_object(
        'id', v_profile.id,
        'email', v_profile.email,
        'first_name', v_profile.first_name,
        'last_name', v_profile.last_name,
        'name', CONCAT(v_profile.first_name, ' ', v_profile.last_name),
        'role', 'admin',
        'specialty', 'Administration',
        'institution', 'FootSense',
        'ahpra_number', '',
        'status', 'active',
        'last_login', NOW(),
        'patient_count', 0,
        'created_at', v_profile.created_at
      )
    );

  ELSE
    RETURN jsonb_build_object(
      'role', v_profile.role,
      'user', jsonb_build_object(
        'id', v_profile.id,
        'email', v_profile.email,
        'first_name', v_profile.first_name,
        'last_name', v_profile.last_name,
        'role', v_profile.role
      )
    );
  END IF;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated, anon, service_role;

NOTIFY pgrst, 'reload schema';
