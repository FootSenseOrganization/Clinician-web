-- ============================================================
-- Migration 004: Create measurements table
-- Core scan data from FootSense device hardware
-- Stores raw ADC values, calibrated temperatures, baselines,
-- room temp sensors, I2C digital readings, and heatmap images
-- ============================================================

CREATE TABLE IF NOT EXISTS measurements (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id                uuid        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  timestamp                 timestamptz NOT NULL,

  -- Raw sensor data: 3D arrays [N frames][20 rows][8 cols] of ADC integers
  -- Frame count varies per scan: 10, 15, or 25
  raw_left                  jsonb       NOT NULL,
  raw_right                 jsonb       NOT NULL,

  -- Baseline: 2D arrays [20 rows][8 cols] — first-frame raw snapshot
  baseline_left             jsonb       NOT NULL,
  baseline_right            jsonb       NOT NULL,

  -- Calibrated: 2D arrays [20 rows][8 cols] — averaged room-temp-calibrated °C floats
  calibrated_left           jsonb       NOT NULL,
  calibrated_right          jsonb       NOT NULL,

  -- Room temperature sensor readings (°C)
  room_temp_start           numeric(6,3),
  room_temp_end             numeric(6,3),

  -- I2C digital sensor readings (object with channel address keys → temp floats)
  -- Left keys: L_ch2_0x48, L_ch2_0x49, L_ch2_0x4A, L_ch2_0x4B, L_ch3_0x48-0x4B
  -- Right keys: R_ch0_0x48-0x4B, R_ch1_0x48-0x4B
  digital_readings_left     jsonb,
  digital_readings_right    jsonb,

  -- Legacy digital readings field (older records, usually empty object)
  digital_readings          jsonb,

  -- Legacy per-frame data with tmp117_readings (newer hardware, 2/44 docs)
  -- Array of {frame_index, raw_left[20x8], raw_right[20x8], tmp117_readings[...]}
  frames                    jsonb,

  -- Heatmap image URLs (Supabase Storage)
  left_image_url            text,
  right_image_url           text,
  left_detected_image_url   text,
  right_detected_image_url  text,

  -- Legacy image format: {detected_9pts_url, room_calibrated_url, raw_url}
  images                    jsonb,

  -- Auto-generated scan notes
  notes                     text,

  created_at                timestamptz DEFAULT now()
);

-- Index for fast patient-based lookups (most common query pattern)
CREATE INDEX idx_measurements_patient     ON measurements(patient_id);
CREATE INDEX idx_measurements_patient_ts  ON measurements(patient_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "measurements_select_all" ON measurements
  FOR SELECT USING (true);

CREATE POLICY "measurements_insert" ON measurements
  FOR INSERT WITH CHECK (true);
