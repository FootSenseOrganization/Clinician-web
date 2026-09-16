-- ============================================================================
-- Migration 018: Drop deprecated tables & old schema
-- Removes: old views, measurement_analyses, clinical_points, old storage,
--          old admins/clinicians/patients (will be recreated with FK to users_profile),
--          old alerts/assignments/remarks/instructions (will be recreated with new FKs)
-- ============================================================================

-- 1. Drop old views
DROP VIEW IF EXISTS alert_with_patient_name CASCADE;
DROP VIEW IF EXISTS clinician_with_patient_count CASCADE;
DROP VIEW IF EXISTS patient_summary CASCADE;

-- 2. Drop tables that are fully deprecated (analysis is now JSONB inside measurements)
DROP TABLE IF EXISTS clinical_points CASCADE;
DROP TABLE IF EXISTS measurement_analyses CASCADE;

-- 3. Drop old dependent tables (will be recreated with FK to users_profile)
DROP TABLE IF EXISTS instructions CASCADE;
DROP TABLE IF EXISTS remarks CASCADE;
DROP TABLE IF EXISTS assignment_requests CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- 4. Drop old role tables (will be recreated as role-extension tables)
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS clinicians CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- 5. Drop old trigger function
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- 6. Drop old storage policies (bucket deletion must use Storage API, not SQL)
DROP POLICY IF EXISTS "foot_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "foot_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "foot_images_update" ON storage.objects;
-- NOTE: Old 'foot-images' bucket can be removed via Supabase Dashboard → Storage

-- 7. Drop old measurements table if it has the old schema
--    (Friend already created new format; old one might still exist from migration 004)
DO $$
BEGIN
  -- Check if old column 'raw_left' exists (old format indicator)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'measurements' AND column_name = 'raw_left'
  ) THEN
    -- Old format — drop it, friend's new format will be created by 016
    DROP TABLE public.measurements CASCADE;
  END IF;
END $$;
