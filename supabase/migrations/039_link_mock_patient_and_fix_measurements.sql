-- ============================================================================
-- Migration 039: Link Mock Patient 6a4621c4, Fix Image URLs & Patient Risk Scores
-- Description:
-- 1. Provisions mock patient '6a4621c4-de4c-4ad6-b52b-29307f2e529c' in
--    users_profile and patients tables, linking to clinician Tharaka Dissanayake.
-- 2. Updates measurement records to replace mock/testserver image URLs with the
--    public Supabase storage bucket URLs (footsense-heatmaps).
-- 3. Recreates public.patient_summary view to dynamically calculate latest_risk_score
--    and latest_risk_level directly from max_asymmetry_celsius instead of expecting
--    a nonexistent risk_score field in analysis JSONB.
-- 4. Creates SECURITY DEFINER RPC get_patient_measurements_definer(uuid) for
--    fail-safe telemetry querying on the patient detail page.
-- ============================================================================

-- 1. Create / link mock patient record to clinician Tharaka Dissanayake
DO $$
DECLARE
  v_clinician_id UUID;
  v_patient_id   UUID := '6a4621c4-de4c-4ad6-b52b-29307f2e529c';
BEGIN
  -- Find Tharaka Dissanayake's profile
  SELECT id INTO v_clinician_id
  FROM public.users_profile
  WHERE LOWER(email) = 'tharakadilshaan@gmail.com' OR role = 'clinician'
  ORDER BY (role = 'clinician') DESC, created_at ASC
  LIMIT 1;

  IF v_clinician_id IS NULL THEN
    v_clinician_id := '737135c1-6aa2-4955-a2ec-7cecdbc9db8a';
  END IF;

  -- Insert or update user profile
  INSERT INTO public.users_profile (
    id, email, first_name, last_name, role, country_code, mobile_number, address, auth_provider
  ) VALUES (
    v_patient_id,
    'robert.williams@patient.footsense.io',
    'Robert',
    'Williams',
    'user',
    '+61',
    '0412 889 900',
    '14 Research Way, Clayton VIC 3168',
    'email'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email;

  -- Insert or update patient role-extension linked to Tharaka
  INSERT INTO public.patients (
    user_id, age, diabetes_type, diagnosis_year, clinician_id
  ) VALUES (
    v_patient_id,
    58,
    'Type 2',
    2018,
    v_clinician_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    clinician_id = v_clinician_id,
    age = EXCLUDED.age,
    diabetes_type = EXCLUDED.diabetes_type,
    diagnosis_year = EXCLUDED.diagnosis_year;

  RAISE NOTICE 'Successfully provisioned patient % linked to clinician %', v_patient_id, v_clinician_id;
END $$;

-- 2. Clean up any testserver / legacy URLs in measurements
UPDATE public.measurements
SET images = jsonb_build_object(
  'detected_9pts_url', REPLACE(images->>'detected_9pts_url', 'http://testserver/static/images/', 'https://cvxmijhbrzrffcjibzel.supabase.co/storage/v1/object/public/footsense-heatmaps/'),
  'room_calibrated_url', REPLACE(images->>'room_calibrated_url', 'http://testserver/static/images/', 'https://cvxmijhbrzrffcjibzel.supabase.co/storage/v1/object/public/footsense-heatmaps/'),
  'raw_url', REPLACE(images->>'raw_url', 'http://testserver/static/images/', 'https://cvxmijhbrzrffcjibzel.supabase.co/storage/v1/object/public/footsense-heatmaps/')
)
WHERE images IS NOT NULL
  AND (images->>'detected_9pts_url' LIKE '%testserver%' OR images->>'room_calibrated_url' LIKE '%testserver%');

-- Clean up any trailing question marks on image URLs in measurements
UPDATE public.measurements
SET images = jsonb_build_object(
  'detected_9pts_url', RTRIM(images->>'detected_9pts_url', '?'),
  'room_calibrated_url', RTRIM(images->>'room_calibrated_url', '?'),
  'raw_url', RTRIM(images->>'raw_url', '?')
)
WHERE images IS NOT NULL
  AND (
    images->>'detected_9pts_url' LIKE '%?'
    OR images->>'room_calibrated_url' LIKE '%?'
    OR images->>'raw_url' LIKE '%?'
  );

-- 3. Recreate patient_summary view with true calculated risk score
DROP VIEW IF EXISTS public.patient_summary CASCADE;
CREATE OR REPLACE VIEW public.patient_summary AS
SELECT
  up.id,
  up.email,
  up.first_name,
  up.last_name,
  CONCAT(up.first_name, ' ', up.last_name) AS name,
  up.country_code,
  up.mobile_number,
  up.address,
  up.role,
  p.age,
  p.diabetes_type,
  p.diagnosis_year,
  p.clinician_id,
  p.firebase_uid,
  up.created_at,
  COALESCE(agg.total_measurements, 0)::integer       AS total_measurements,
  agg.last_measurement,
  COALESCE(latest.latest_risk_score, 0)::integer      AS latest_risk_score,
  COALESCE(latest.latest_risk_level, 'low')           AS latest_risk_level
FROM public.users_profile up
JOIN public.patients p ON p.user_id = up.id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::integer   AS total_measurements,
    MAX(m.timestamp)    AS last_measurement
  FROM public.measurements m
  WHERE m.user_id = up.id
) agg ON true
LEFT JOIN LATERAL (
  SELECT
    LEAST(100, ROUND(COALESCE((m2.analysis->>'max_asymmetry_celsius')::numeric, m2.max_asymmetry_celsius::numeric, 0) * 10))::integer AS latest_risk_score,
    CASE
      WHEN COALESCE((m2.analysis->>'max_asymmetry_celsius')::numeric, m2.max_asymmetry_celsius::numeric, 0) >= 6.0 THEN 'high'
      WHEN COALESCE((m2.analysis->>'max_asymmetry_celsius')::numeric, m2.max_asymmetry_celsius::numeric, 0) >= 3.0 THEN 'moderate'
      ELSE 'low'
    END AS latest_risk_level
  FROM public.measurements m2
  WHERE m2.user_id = up.id
  ORDER BY m2.timestamp DESC
  LIMIT 1
) latest ON true;

-- 4. Fail-safe RPC to retrieve all measurements for a patient
CREATE OR REPLACE FUNCTION public.get_patient_measurements_definer(p_patient_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(m)), '[]'::jsonb) INTO result
  FROM (
    SELECT * FROM public.measurements
    WHERE user_id = p_patient_id
    ORDER BY timestamp DESC
  ) m;
  RETURN result;
END;
$$;

-- 5. Grant Permissions & Schema Cache Reload
GRANT SELECT ON public.patient_summary TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_patient_measurements_definer(UUID) TO authenticated, anon, service_role;

NOTIFY pgrst, 'reload schema';
