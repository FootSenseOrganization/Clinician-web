-- ============================================================================
-- Migration 020: Recreate clinicians table (role-extension for users_profile)
-- Only stores clinician-specific attributes beyond what users_profile has.
-- All columns optional so admin↔clinician role switch is frictionless.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clinicians (
  user_id         UUID        PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
  specialty       TEXT,         -- e.g. 'Podiatry', 'Endocrinology'
  institution     TEXT,         -- e.g. 'City Medical'
  ahpra_number    TEXT,         -- Australian practitioner registration
  avatar_initials TEXT,         -- e.g. 'SC' for sidebar display
  status          TEXT         DEFAULT 'active' CHECK (status IS NULL OR status IN ('active', 'suspended')),
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  DEFAULT now()
);

-- Unique AHPRA when set
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinicians_ahpra
  ON public.clinicians(ahpra_number) WHERE ahpra_number IS NOT NULL;

ALTER TABLE public.clinicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View clinicians (Clinician, Admin)" ON public.clinicians
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Update own clinician profile" ON public.clinicians
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Insert clinician (self, Admin)" ON public.clinicians
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Delete clinician (Admin)" ON public.clinicians
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');
