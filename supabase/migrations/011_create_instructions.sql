-- ============================================================
-- Migration 011: Create instructions table
-- Clinician instructions visible to patients on mobile app
-- ============================================================

CREATE TABLE IF NOT EXISTS instructions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          uuid        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id        uuid        NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  content             text        NOT NULL,
  visible_to_patient  boolean     DEFAULT true,
  created_at          timestamptz DEFAULT now()
);

-- Index for patient's instructions feed
CREATE INDEX idx_instructions_patient ON instructions(patient_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructions_select_all" ON instructions
  FOR SELECT USING (true);

CREATE POLICY "instructions_insert" ON instructions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "instructions_update" ON instructions
  FOR UPDATE USING (true);

CREATE POLICY "instructions_delete" ON instructions
  FOR DELETE USING (true);
