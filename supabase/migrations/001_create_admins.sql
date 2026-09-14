-- ============================================================
-- Migration 001: Create admins table
-- Platform administrators who review clinician applications
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        UNIQUE NOT NULL,
  password_hash text      NOT NULL,
  name        text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS: Allow read access for authenticated users (admin checks)
CREATE POLICY "admins_select_all" ON admins
  FOR SELECT USING (true);
