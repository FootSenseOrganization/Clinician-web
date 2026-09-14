-- ============================================================
-- Migration 003: Create patients table
-- Patients being monitored by clinicians
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  email           text        UNIQUE NOT NULL,
  age             integer     NOT NULL,
  diabetes_type   text        NOT NULL
                              CHECK (diabetes_type IN ('Type 1', 'Type 2', 'Pre-diabetic')),
  diagnosis_year  integer     NOT NULL,
  phone           text,
  clinician_id    uuid        REFERENCES clinicians(id) ON DELETE SET NULL,
  avatar_initials text        NOT NULL,
  firebase_uid    text,
  created_at      timestamptz DEFAULT now()
);

-- Index for fast clinician-based lookups
CREATE INDEX idx_patients_clinician ON patients(clinician_id);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- RLS: Allow read for all (clinicians need to see their patients)
CREATE POLICY "patients_select_all" ON patients
  FOR SELECT USING (true);

-- RLS: Allow insert/update
CREATE POLICY "patients_insert" ON patients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "patients_update" ON patients
  FOR UPDATE USING (true);
