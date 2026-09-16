-- ============================================================================
-- FootSense Supabase Migration 032: Add tmp117_session column to measurements
-- Description: Stores per-frame TMP117 digital sensor readings array
--              matching the FootSenseAnalytics storage format.
--              Each element: { frame_index, count, readings: [{ sensor_id, raw_id,
--              channel, addr, temp_c, is_room }] }
--              Drops legacy redundant single-reading columns.
-- ============================================================================

ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS tmp117_session JSONB,
  DROP COLUMN IF EXISTS tmp117_readings_left,
  DROP COLUMN IF EXISTS tmp117_readings_right;

COMMENT ON COLUMN public.measurements.tmp117_session IS
  'Per-frame TMP117 digital readings array. Each element: { frame_index: int, count: int, readings: [{ sensor_id, raw_id, channel, addr, temp_c, is_room }] }';
