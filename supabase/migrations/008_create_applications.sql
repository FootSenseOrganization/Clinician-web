-- ============================================================
-- Migration 008: Create applications table
-- Clinician registration applications reviewed by admins
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ahpra_number    text        NOT NULL,
  full_name       text        NOT NULL,
  email           text        NOT NULL,
  specialty       text        NOT NULL,
  institution     text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'declined')),
  decline_reason  text,
  reviewed_by     uuid        REFERENCES admins(id) ON DELETE SET NULL,
  submitted_at    timestamptz DEFAULT now(),
  reviewed_at     timestamptz
);

-- Index for status-based filtering (admin view)
CREATE INDEX idx_applications_status ON applications(status, submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_select_all" ON applications
  FOR SELECT USING (true);

CREATE POLICY "applications_insert" ON applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "applications_update" ON applications
  FOR UPDATE USING (true);
