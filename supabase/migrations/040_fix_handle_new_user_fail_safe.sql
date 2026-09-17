-- ============================================================================
-- Migration 040: Fix handle_new_user Fail-Safe Trigger
-- Description:
-- Ensures handle_new_user() catches all exceptions (WHEN OTHERS THEN)
-- so Supabase GoTrue never aborts with "Database error saving new user"
-- when unregistered Google accounts sign in.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
  assigned_role TEXT;
BEGIN
  -- 1. Check if email already exists in users_profile (case-insensitive)
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

  -- 2. Otherwise, determine role
  assigned_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
  IF assigned_role NOT IN ('user', 'clinician', 'admin') THEN
    assigned_role := 'user';
  END IF;

  -- 3. Fail-safe insertion with catch-all exception handler
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
    WHEN OTHERS THEN
      RAISE LOG 'handle_new_user exception ignored for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

NOTIFY pgrst, 'reload schema';
