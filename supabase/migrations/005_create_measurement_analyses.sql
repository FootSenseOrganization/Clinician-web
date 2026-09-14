-- ============================================================
-- Migration 005: Create measurement_analyses table
-- Analysis results computed from calibrated data (1:1 with measurements)
-- Maps to MongoDB analysis sub-document
-- ============================================================

CREATE TABLE IF NOT EXISTS measurement_analyses (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id          uuid        UNIQUE NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,

  -- Averaged temperature grids: 2D arrays [20 rows][8 cols] of °C floats
  avg_left                jsonb       NOT NULL,
  avg_right               jsonb       NOT NULL,

  -- Maximum left-right temperature difference across all zones
  max_asymmetry_celsius   numeric(5,2) NOT NULL,

  -- Alert status
  alert_triggered         boolean     NOT NULL DEFAULT false,
  alert_severity          text,

  -- Zone asymmetry: object mapping 9 anatomical zone names → °C difference
  -- Keys: "Heel (Calcaneus)", "Medial Midfoot (Arch)", "Lateral Midfoot",
  --        "1st Metatarsal (Inner Ball)", "3rd Metatarsal (Center Ball)",
  --        "5th Metatarsal (Outer Ball)", "Big Toe (Hallux)", "3rd Toe", "5th Toe"
  zone_asymmetry          jsonb       NOT NULL,

  -- Risk assessment (computed on insert, not stored in MongoDB)
  risk_score              integer     NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level              text        NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high'))
);

-- Enable Row Level Security
ALTER TABLE measurement_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "measurement_analyses_select_all" ON measurement_analyses
  FOR SELECT USING (true);

CREATE POLICY "measurement_analyses_insert" ON measurement_analyses
  FOR INSERT WITH CHECK (true);
