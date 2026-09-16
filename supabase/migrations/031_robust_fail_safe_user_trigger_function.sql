-- ============================================================================
-- FootSense Supabase Migration 031: Robust Fail-Safe User Trigger Function
-- Description: Replaces handle_new_user() trigger with fail-safe error handling,
--              role sanitization, and ON CONFLICT update.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Normalize role to lower case and validate against allowed enum values
  assigned_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
  IF assigned_role NOT IN ('user', 'clinician', 'admin') THEN
    assigned_role := 'user';
  END IF;

  BEGIN
    INSERT INTO public.users_profile (
      id,
      email,
      first_name,
      last_name,
      country_code,
      mobile_number,
      role,
      auth_provider
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'FootSense'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'country_code', ''), '+61'),
      NULLIF(NEW.raw_user_meta_data->>'mobile_number', ''),
      assigned_role,
      COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error executing handle_new_user trigger: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
