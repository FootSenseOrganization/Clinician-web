-- ============================================================================
-- Migration 019: Recreate admins table (role-extension for users_profile)
-- Only stores admin-specific attributes beyond what users_profile has.
-- All columns optional so clinician→admin role switch is frictionless.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admins (
  user_id         UUID        PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
  permissions     JSONB,       -- optional: granular permission flags for future use
  notes           TEXT,         -- optional: internal admin notes
  created_at      TIMESTAMPTZ  DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View admins (Admin)" ON public.admins
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Manage admins (Admin)" ON public.admins
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
