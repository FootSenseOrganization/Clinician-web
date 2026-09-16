-- ============================================================================
-- Migration 024: Recreate applications table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ahpra_number    TEXT        NOT NULL,
  full_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  specialty       TEXT        NOT NULL,
  institution     TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'declined')),
  decline_reason  TEXT,
  reviewed_by     UUID        REFERENCES public.users_profile(id) ON DELETE SET NULL,
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status, submitted_at DESC);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View applications (Clinician, Admin)" ON public.applications
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('clinician', 'admin'));

CREATE POLICY "Insert applications" ON public.applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update applications (Admin)" ON public.applications
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Delete applications (Admin)" ON public.applications
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');
