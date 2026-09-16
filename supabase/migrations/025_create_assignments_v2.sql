-- ============================================================================
-- Migration 025: Recreate assignment_requests table (FKs → users_profile)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assignment_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID        REFERENCES public.users_profile(id) ON DELETE SET NULL,
  clinician_id    UUID        NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  patient_name    TEXT        NOT NULL,
  patient_email   TEXT        NOT NULL,
  diabetes_type   TEXT        NOT NULL,
  age             INTEGER     NOT NULL,
  device_model    TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'accepted', 'declined')),
  requested_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_requests_clinician
  ON public.assignment_requests(clinician_id, status, requested_at DESC);

ALTER TABLE public.assignment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View assignments (Clinician, Admin)" ON public.assignment_requests
  FOR SELECT USING (
    auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Insert assignments" ON public.assignment_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update assignments (Clinician, Admin)" ON public.assignment_requests
  FOR UPDATE USING (
    auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Delete assignments (Clinician, Admin)" ON public.assignment_requests
  FOR DELETE USING (
    auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );
