-- ============================================================================
-- Migration 023: Recreate alerts table (FKs → users_profile)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.alerts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID        NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  clinician_id    UUID        NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  measurement_id  UUID        REFERENCES public.measurements(id) ON DELETE SET NULL,
  timestamp       TIMESTAMPTZ NOT NULL,
  risk_level      TEXT        NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
  risk_score      INTEGER     NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  message         TEXT        NOT NULL,
  zone            TEXT,
  asymmetry_value NUMERIC(5,2),
  acknowledged    BOOLEAN     DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_clinician ON public.alerts(clinician_id, acknowledged, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_patient   ON public.alerts(patient_id, created_at DESC);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View alerts (User, Clinician, Admin)" ON public.alerts
  FOR SELECT USING (
    auth.uid() = patient_id
    OR auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert alerts" ON public.alerts
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IN ('clinician', 'admin')
    OR auth.uid() = patient_id
  );

CREATE POLICY "Update alerts (Clinician, Admin)" ON public.alerts
  FOR UPDATE USING (
    auth.uid() = clinician_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Delete alerts (Admin)" ON public.alerts
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');
