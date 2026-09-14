-- ============================================================
-- Migration 006: Create clinical_points table
-- 9 anatomical clinical points per foot per measurement (18 total)
-- With pixel coords for heatmap overlay + grid coords for sensor array
-- ============================================================

CREATE TABLE IF NOT EXISTS clinical_points (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id  uuid        NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  foot            text        NOT NULL CHECK (foot IN ('left', 'right')),
  zone            text        NOT NULL,
  temp_celsius    numeric(5,2) NOT NULL,
  pixel_x         integer     NOT NULL,
  pixel_y         integer     NOT NULL,
  grid_row        numeric(6,2) NOT NULL,
  grid_col        numeric(6,2) NOT NULL
);

-- Composite index for efficient measurement + foot lookups
CREATE INDEX idx_clinical_points_measurement ON clinical_points(measurement_id, foot);

-- Unique constraint: one point per zone per foot per measurement
CREATE UNIQUE INDEX idx_clinical_points_unique
  ON clinical_points(measurement_id, foot, zone);

-- Enable Row Level Security
ALTER TABLE clinical_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinical_points_select_all" ON clinical_points
  FOR SELECT USING (true);

CREATE POLICY "clinical_points_insert" ON clinical_points
  FOR INSERT WITH CHECK (true);
