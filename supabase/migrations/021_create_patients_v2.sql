-- ============================================================================
-- Migration 021: Recreate patients table (role-extension for users_profile)
-- Only stores patient-specific attributes beyond what users_profile has.
-- All columns optional so role switching is frictionless.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.patients (
  user_id         UUID        PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
  age             INTEGER,
  diabetes_type   TEXT         CHECK (diabetes_type IS NULL OR diabetes_type IN ('Type 1', 'Type 2', 'Pre-diabetic')),
  diagnosis_year  INTEGER,
  clinician_id    UUID         REFERENCES public.users_profile(id) ON DELETE SET NULL,  -- assigned clinician
  avatar_initials TEXT,
  firebase_uid    TEXT,         -- legacy mobile app UID
  created_at      TIMESTAMPTZ  DEFAULT now()
);

-- Index for clinician-based patient lookups
CREATE INDEX IF NOT EXISTS idx_patients_clinician ON public.patients(clinician_id);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View patients (User, Clinician, Admin)" ON public.patients
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Update own patient profile" ON public.patients
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert patient (self, Clinician, Admin)" ON public.patients
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Delete patient (Admin)" ON public.patients
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');
