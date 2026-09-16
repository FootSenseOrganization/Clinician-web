-- ============================================================================
-- Migration 034: Automate Clinician Provisioning on Application Approval
-- Description: When an Admin approves a clinician application, this trigger
-- automatically creates or upgrades the user in `users_profile` and inserts
-- their professional details into the `clinicians` table. 
-- The user is now fully provisioned and simply waits to sign in with Google.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_application_approval()
RETURNS TRIGGER AS $$
DECLARE
  target_profile_id UUID;
  fname TEXT;
  lname TEXT;
  initials TEXT;
BEGIN
  -- Only trigger when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Extract basic first/last name
    fname := COALESCE(NULLIF(split_part(NEW.full_name, ' ', 1), ''), 'Dr.');
    lname := COALESCE(NULLIF(substring(NEW.full_name from position(' ' in NEW.full_name) + 1), ''), 'Clinician');
    initials := upper(substring(fname from 1 for 1) || substring(lname from 1 for 1));

    -- Check if they already exist in users_profile (e.g., they tried logging in early as a 'user')
    SELECT id INTO target_profile_id FROM public.users_profile WHERE email = NEW.email LIMIT 1;

    IF target_profile_id IS NULL THEN
      -- Create a brand new profile for them
      target_profile_id := gen_random_uuid();
      
      INSERT INTO public.users_profile (
        id, email, first_name, last_name, role, auth_provider
      ) VALUES (
        target_profile_id,
        NEW.email,
        fname,
        lname,
        'clinician',
        'email'
      );
    ELSE
      -- Upgrade existing user to clinician (unless they are admin)
      UPDATE public.users_profile 
      SET role = 'clinician', updated_at = NOW() 
      WHERE id = target_profile_id AND role != 'admin';
    END IF;

    -- Now insert or update their professional details in the clinicians table
    INSERT INTO public.clinicians (
      user_id, specialty, institution, ahpra_number, avatar_initials
    ) VALUES (
      target_profile_id,
      NEW.specialty,
      NEW.institution,
      NEW.ahpra_number,
      initials
    )
    ON CONFLICT (user_id) DO UPDATE SET
      specialty = EXCLUDED.specialty,
      institution = EXCLUDED.institution,
      ahpra_number = EXCLUDED.ahpra_number;
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_application_approved ON public.applications;

-- Attach the trigger to the applications table
CREATE TRIGGER on_application_approved
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_application_approval();
