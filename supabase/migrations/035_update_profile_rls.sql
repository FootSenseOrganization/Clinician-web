-- ============================================================================
-- Migration 035: Update RLS for users_profile and clinicians
-- Description: The frontend profile saving failed because we forgot to update 
-- the RLS policies for the users_profile and clinicians tables to use the 
-- new get_auth_profile_id() translator for Google Auth.
-- ============================================================================

-- 1. Drop old policies
DROP POLICY IF EXISTS "View profile policy (User, Clinician, Admin)" ON public.users_profile;
DROP POLICY IF EXISTS "Update profile policy (User, Admin)" ON public.users_profile;
DROP POLICY IF EXISTS "Insert profile policy (User, Admin)" ON public.users_profile;
DROP POLICY IF EXISTS "Delete profile policy (Admin only)" ON public.users_profile;

DROP POLICY IF EXISTS "View clinicians (Clinician, Admin)" ON public.clinicians;
DROP POLICY IF EXISTS "Update own clinician profile" ON public.clinicians;
DROP POLICY IF EXISTS "Insert clinician (self, Admin)" ON public.clinicians;
DROP POLICY IF EXISTS "Delete clinician (Admin)" ON public.clinicians;

-- 2. Recreate users_profile policies
CREATE POLICY "View profile policy (User, Clinician, Admin)"
  ON public.users_profile FOR SELECT
  USING (
    public.get_auth_profile_id(auth.uid()) = id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Update profile policy (User, Admin)"
  ON public.users_profile FOR UPDATE
  USING (
    public.get_auth_profile_id(auth.uid()) = id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Insert profile policy (User, Admin)"
  ON public.users_profile FOR INSERT
  WITH CHECK (
    public.get_auth_profile_id(auth.uid()) = id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Delete profile policy (Admin only)"
  ON public.users_profile FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- 3. Recreate clinicians policies
CREATE POLICY "View clinicians (Clinician, Admin)" ON public.clinicians
  FOR SELECT USING (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Update own clinician profile" ON public.clinicians
  FOR UPDATE USING (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Insert clinician (self, Admin)" ON public.clinicians
  FOR INSERT WITH CHECK (
    public.get_auth_profile_id(auth.uid()) = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Delete clinician (Admin)" ON public.clinicians
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');
