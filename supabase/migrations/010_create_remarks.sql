-- ============================================================
-- Migration 010: Create remarks table
-- Clinician notes/remarks about a patient
-- ============================================================

CREATE TABLE IF NOT EXISTS remarks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id  uuid        NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  content       text        NOT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index for patient's remarks feed
CREATE INDEX idx_remarks_patient ON remarks(patient_id, created_at DESC);

-- Trigger to auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER remarks_updated_at
  BEFORE UPDATE ON remarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "remarks_select_all" ON remarks
  FOR SELECT USING (true);

CREATE POLICY "remarks_insert" ON remarks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "remarks_update" ON remarks
  FOR UPDATE USING (true);

CREATE POLICY "remarks_delete" ON remarks
  FOR DELETE USING (true);
