-- ============================================================================
-- Migration 033: Robust RLS for Google Auth (ID Translation Pattern)
-- Description: Google OAuth creates a new auth.uid() that doesn't match 
-- existing users_profile.id. This migration adds an auth_id mapping column,
-- updates the trigger to link accounts by email, and replaces auth.uid() 
-- in all policies with a translator function get_auth_profile_id().
-- ============================================================================

-- 1. Add auth_id column to map Google Auth ID to the existing profile
ALTER TABLE public.users_profile ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- 2. Create the ID Translator Function
-- This function takes auth.uid() and returns the true users_profile.id
CREATE OR REPLACE FUNCTION public.get_auth_profile_id(uid UUID)
RETURNS UUID AS $$
  SELECT id FROM public.users_profile WHERE id = uid OR auth_id = uid LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Update the existing get_user_role helper to use the translator
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.users_profile WHERE id = public.get_auth_profile_id(user_id);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Update the trigger to link existing accounts by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
  assigned_role TEXT;
BEGIN
  -- Check if email already exists in users_profile
  SELECT id INTO existing_user_id FROM public.users_profile WHERE email = NEW.email LIMIT 1;
  
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
      NEW.id, NEW.id, NEW.email,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'FootSense'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'country_code', ''), '+61'),
      NULLIF(NEW.raw_user_meta_data->>'mobile_number', ''),
      assigned_role,
      COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error executing handle_new_user trigger: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Drop old policies
DROP POLICY IF EXISTS "View patients (User, Clinician, Admin)" ON public.patients;
DROP POLICY IF EXISTS "Update own patient profile" ON public.patients;
DROP POLICY IF EXISTS "Insert patient (self, Clinician, Admin)" ON public.patients;
DROP POLICY IF EXISTS "Delete patient (Admin)" ON public.patients;

DROP POLICY IF EXISTS "View measurements policy (User, Clinician, Admin)" ON public.measurements;
DROP POLICY IF EXISTS "Insert measurements policy (User, Admin)" ON public.measurements;
DROP POLICY IF EXISTS "Update measurements policy (User, Clinician, Admin)" ON public.measurements;
DROP POLICY IF EXISTS "Delete measurements policy (User, Admin)" ON public.measurements;

DROP POLICY IF EXISTS "View alerts (User, Clinician, Admin)" ON public.alerts;
DROP POLICY IF EXISTS "Insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Update alerts (Clinician, Admin)" ON public.alerts;
DROP POLICY IF EXISTS "Delete alerts (Admin)" ON public.alerts;

DROP POLICY IF EXISTS "View remarks (User, Clinician, Admin)" ON public.remarks;
DROP POLICY IF EXISTS "Insert remarks (Clinician, Admin)" ON public.remarks;
DROP POLICY IF EXISTS "Update remarks (Clinician, Admin)" ON public.remarks;
DROP POLICY IF EXISTS "Delete remarks (Clinician, Admin)" ON public.remarks;

DROP POLICY IF EXISTS "View instructions (User, Clinician, Admin)" ON public.instructions;
DROP POLICY IF EXISTS "Insert instructions (Clinician, Admin)" ON public.instructions;
DROP POLICY IF EXISTS "Update instructions (Clinician, Admin)" ON public.instructions;
DROP POLICY IF EXISTS "Delete instructions (Clinician, Admin)" ON public.instructions;

DROP POLICY IF EXISTS "View applications (Clinician, Admin)" ON public.applications;
DROP POLICY IF EXISTS "Insert applications" ON public.applications;
DROP POLICY IF EXISTS "Update applications (Admin)" ON public.applications;
DROP POLICY IF EXISTS "Delete applications (Admin)" ON public.applications;

DROP POLICY IF EXISTS "View assignments (Clinician, Admin)" ON public.assignment_requests;
DROP POLICY IF EXISTS "Insert assignments" ON public.assignment_requests;
DROP POLICY IF EXISTS "Update assignments (Clinician, Admin)" ON public.assignment_requests;
DROP POLICY IF EXISTS "Delete assignments (Clinician, Admin)" ON public.assignment_requests;


-- 6. Recreate Policies using the get_auth_profile_id() translator

-- Patients
CREATE POLICY "View patients (User, Clinician, Admin)" ON public.patients
  FOR SELECT USING (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_auth_profile_id(auth.uid()) = clinician_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Update own patient profile" ON public.patients
  FOR UPDATE USING (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert patient (self, Clinician, Admin)" ON public.patients
  FOR INSERT WITH CHECK (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Delete patient (Admin)" ON public.patients
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Measurements
CREATE POLICY "View measurements policy (User, Clinician, Admin)" ON public.measurements
  FOR SELECT USING (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert measurements policy (User, Admin)" ON public.measurements
  FOR INSERT WITH CHECK (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Update measurements policy (User, Clinician, Admin)" ON public.measurements
  FOR UPDATE USING (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Delete measurements policy (User, Admin)" ON public.measurements
  FOR DELETE USING (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

-- Alerts
CREATE POLICY "View alerts (User, Clinician, Admin)" ON public.alerts
  FOR SELECT USING (
    public.get_auth_profile_id(auth.uid()) = patient_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert alerts" ON public.alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update alerts (Clinician, Admin)" ON public.alerts
  FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('clinician', 'admin'));

CREATE POLICY "Delete alerts (Admin)" ON public.alerts
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Remarks
CREATE POLICY "View remarks (User, Clinician, Admin)" ON public.remarks
  FOR SELECT USING (
    public.get_auth_profile_id(auth.uid()) = patient_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert remarks (Clinician, Admin)" ON public.remarks
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('clinician', 'admin'));

CREATE POLICY "Update remarks (Clinician, Admin)" ON public.remarks
  FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('clinician', 'admin'));

CREATE POLICY "Delete remarks (Clinician, Admin)" ON public.remarks
  FOR DELETE USING (public.get_user_role(auth.uid()) IN ('clinician', 'admin'));

-- Instructions
CREATE POLICY "View instructions (User, Clinician, Admin)" ON public.instructions
  FOR SELECT USING (
    (public.get_auth_profile_id(auth.uid()) = patient_id AND visible_to_patient = true)
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert instructions (Clinician, Admin)" ON public.instructions
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('clinician', 'admin'));

CREATE POLICY "Update instructions (Clinician, Admin)" ON public.instructions
  FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('clinician', 'admin'));

CREATE POLICY "Delete instructions (Clinician, Admin)" ON public.instructions
  FOR DELETE USING (public.get_user_role(auth.uid()) IN ('clinician', 'admin'));

-- Applications
CREATE POLICY "View applications (Clinician, Admin)" ON public.applications
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert applications" ON public.applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update applications (Admin)" ON public.applications
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Delete applications (Admin)" ON public.applications
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Assignment Requests
CREATE POLICY "View assignments (Clinician, Admin)" ON public.assignment_requests
  FOR SELECT USING (
    public.get_auth_profile_id(auth.uid()) = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Insert assignments" ON public.assignment_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update assignments (Clinician, Admin)" ON public.assignment_requests
  FOR UPDATE USING (
    public.get_auth_profile_id(auth.uid()) = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Delete assignments (Clinician, Admin)" ON public.assignment_requests
  FOR DELETE USING (
    public.get_auth_profile_id(auth.uid()) = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

-- 7. Ensure Sarah Chen's email is updated for easy testing
UPDATE users_profile 
SET email = 'tharakadilshaan@gmail.com'
WHERE email = 'sarah.chen@citymedical.com';
