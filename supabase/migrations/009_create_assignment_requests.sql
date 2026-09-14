-- ============================================================
-- Migration 009: Create assignment_requests table
-- Patients requesting a specific clinician
-- ============================================================

CREATE TABLE IF NOT EXISTS assignment_requests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid        REFERENCES patients(id) ON DELETE SET NULL,
  clinician_id    uuid        NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  patient_name    text        NOT NULL,
  patient_email   text        NOT NULL,
  diabetes_type   text        NOT NULL,
  age             integer     NOT NULL,
  device_model    text,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'accepted', 'declined')),
  requested_at    timestamptz DEFAULT now()
);

-- Index for clinician's pending requests
CREATE INDEX idx_assignment_requests_clinician
  ON assignment_requests(clinician_id, status, requested_at DESC);

-- Enable Row Level Security
ALTER TABLE assignment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignment_requests_select_all" ON assignment_requests
  FOR SELECT USING (true);

CREATE POLICY "assignment_requests_insert" ON assignment_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "assignment_requests_update" ON assignment_requests
  FOR UPDATE USING (true);

CREATE POLICY "assignment_requests_delete" ON assignment_requests
  FOR DELETE USING (true);
