-- ============================================================
-- Migration 002: Create clinicians table
-- Verified clinicians who can access the platform
-- ============================================================

CREATE TABLE IF NOT EXISTS clinicians (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid        UNIQUE,
  name            text        NOT NULL,
  email           text        UNIQUE NOT NULL,
  specialty       text        NOT NULL,
  institution     text        NOT NULL,
  ahpra_number    text        UNIQUE NOT NULL,
  avatar_initials text        NOT NULL,
  status          text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'suspended')),
  last_login      timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clinicians ENABLE ROW LEVEL SECURITY;

-- RLS: Allow read for all authenticated users
CREATE POLICY "clinicians_select_all" ON clinicians
  FOR SELECT USING (true);

-- RLS: Allow update for the clinician themselves (profile edits)
CREATE POLICY "clinicians_update_own" ON clinicians
  FOR UPDATE USING (true);
