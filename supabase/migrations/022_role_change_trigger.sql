-- ============================================================================
-- Migration 022: Role Change Trigger
-- When users_profile.role changes, auto-manage role-specific tables:
--   - Delete row from OLD role table
--   - Insert empty row into NEW role table
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when role actually changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN

    -- Remove from old role-specific table
    IF OLD.role = 'admin' THEN
      DELETE FROM public.admins WHERE user_id = NEW.id;
    ELSIF OLD.role = 'clinician' THEN
      DELETE FROM public.clinicians WHERE user_id = NEW.id;
    ELSIF OLD.role = 'user' THEN
      DELETE FROM public.patients WHERE user_id = NEW.id;
    END IF;

    -- Insert into new role-specific table (with defaults / empty optional columns)
    IF NEW.role = 'admin' THEN
      INSERT INTO public.admins (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
    ELSIF NEW.role = 'clinician' THEN
      INSERT INTO public.clinicians (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
    ELSIF NEW.role = 'user' THEN
      INSERT INTO public.patients (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
    END IF;

  END IF;

  -- Always update updated_at
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_role_change ON public.users_profile;
CREATE TRIGGER on_role_change
  BEFORE UPDATE ON public.users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_role_change();

-- Also extend the handle_new_user trigger to auto-create role-specific row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');

  -- Create users_profile
  INSERT INTO public.users_profile (id, email, first_name, last_name, role, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    user_role,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-create role-specific row
  IF user_role = 'admin' THEN
    INSERT INTO public.admins (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSIF user_role = 'clinician' THEN
    INSERT INTO public.clinicians (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.patients (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
