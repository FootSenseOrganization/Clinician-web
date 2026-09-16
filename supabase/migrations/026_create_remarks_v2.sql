-- ============================================================================
-- Migration 026: Recreate remarks table (FKs → users_profile)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.remarks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID        NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  clinician_id  UUID        NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  content       TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_remarks_patient ON public.remarks(patient_id, created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER remarks_updated_at
  BEFORE UPDATE ON public.remarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.remarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View remarks (User, Clinician, Admin)" ON public.remarks
  FOR SELECT USING (
    auth.uid() = patient_id
    OR auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert remarks (Clinician, Admin)" ON public.remarks
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Update remarks (Clinician, Admin)" ON public.remarks
  FOR UPDATE USING (
    auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Delete remarks (Clinician, Admin)" ON public.remarks
  FOR DELETE USING (
    auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );
