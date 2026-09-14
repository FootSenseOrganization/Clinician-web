-- ============================================================
-- Migration 007: Create alerts table
-- Risk alerts generated from measurement analyses
-- ============================================================

CREATE TABLE IF NOT EXISTS alerts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id    uuid        NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  measurement_id  uuid        REFERENCES measurements(id) ON DELETE SET NULL,
  timestamp       timestamptz NOT NULL,
  risk_level      text        NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
  risk_score      integer     NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  message         text        NOT NULL,
  zone            text,
  asymmetry_value numeric(5,2),
  acknowledged    boolean     DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Index for clinician's alert feed
CREATE INDEX idx_alerts_clinician ON alerts(clinician_id, acknowledged, created_at DESC);
-- Index for patient-specific alerts
CREATE INDEX idx_alerts_patient   ON alerts(patient_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_all" ON alerts
  FOR SELECT USING (true);

CREATE POLICY "alerts_insert" ON alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "alerts_update" ON alerts
  FOR UPDATE USING (true);
