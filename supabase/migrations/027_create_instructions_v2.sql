-- ============================================================================
-- Migration 027: Recreate instructions table (FKs → users_profile)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.instructions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID        NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  clinician_id        UUID        NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  content             TEXT        NOT NULL,
  visible_to_patient  BOOLEAN     DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instructions_patient ON public.instructions(patient_id, created_at DESC);

ALTER TABLE public.instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View instructions (User, Clinician, Admin)" ON public.instructions
  FOR SELECT USING (
    auth.uid() = patient_id
    OR auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert instructions (Clinician, Admin)" ON public.instructions
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Update instructions (Clinician, Admin)" ON public.instructions
  FOR UPDATE USING (
    auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Delete instructions (Clinician, Admin)" ON public.instructions
  FOR DELETE USING (
    auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );
