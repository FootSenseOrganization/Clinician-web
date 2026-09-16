-- ============================================================================
-- Migration 016: Measurements Table v2 (Friend's migration — ALREADY APPLIED)
-- 25-frame thermal array telemetry with inline analysis JSONB
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  -- Room Ambient Temperatures
  room_temp_start_celsius REAL,
  room_temp_end_celsius REAL,

  -- Asymmetry Metrics & Alert Status
  max_asymmetry_celsius REAL,
  alert_triggered BOOLEAN DEFAULT FALSE,
  alert_severity TEXT,

  -- Full 25-Frame Thermal Sensor Grids (20x8 ADC Raw Data per Foot)
  raw_left_frames JSONB NOT NULL,
  raw_right_frames JSONB NOT NULL,

  -- TMP117 Precision Ambient Reference Readings
  tmp117_readings_left JSONB,
  tmp117_readings_right JSONB,

  -- Calibrated Temperature Grids (°C)
  calibrated_left JSONB,
  calibrated_right JSONB,

  -- Anatomical Landmark Analysis & 9-Point Clinical Coordinates
  analysis JSONB,

  -- Supabase Storage Generated Heatmap URLs
  images JSONB
);

CREATE INDEX IF NOT EXISTS idx_measurements_user_timestamp
  ON public.measurements(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_measurements_severity
  ON public.measurements(alert_severity);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View measurements policy (User, Clinician, Admin)"
  ON public.measurements FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Insert measurements policy (User, Admin)"
  ON public.measurements FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Update measurements policy (User, Clinician, Admin)"
  ON public.measurements FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Delete measurements policy (User, Admin)"
  ON public.measurements FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );
