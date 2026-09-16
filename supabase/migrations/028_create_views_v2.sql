-- ============================================================================
-- Migration 028: Recreate views for new schema
-- Adapted to users_profile + role-specific extension tables
-- ============================================================================

-- -------------------------------------------------------
-- patient_summary: joins users_profile + patients + computed measurement stats
-- -------------------------------------------------------
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
  up.created_at,
  p.age,
  p.diabetes_type,
  p.diagnosis_year,
  p.clinician_id,
  p.avatar_initials,
  p.firebase_uid,
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
    (m2.analysis->>'risk_score')::integer AS latest_risk_score,
    m2.analysis->>'risk_level'            AS latest_risk_level
  FROM public.measurements m2
  WHERE m2.user_id = up.id AND m2.analysis IS NOT NULL
  ORDER BY m2.timestamp DESC
  LIMIT 1
) latest ON true;

-- -------------------------------------------------------
-- clinician_summary: joins users_profile + clinicians + patient count
-- -------------------------------------------------------
CREATE OR REPLACE VIEW public.clinician_summary AS
SELECT
  up.id,
  up.email,
  up.first_name,
  up.last_name,
  CONCAT(up.first_name, ' ', up.last_name) AS name,
  up.role,
  up.created_at,
  c.specialty,
  c.institution,
  c.ahpra_number,
  c.avatar_initials,
  c.status,
  c.last_login,
  COUNT(p.user_id)::integer AS patient_count
FROM public.users_profile up
JOIN public.clinicians c ON c.user_id = up.id
LEFT JOIN public.patients p ON p.clinician_id = up.id
GROUP BY up.id, up.email, up.first_name, up.last_name, up.role, up.created_at,
         c.specialty, c.institution, c.ahpra_number, c.avatar_initials, c.status, c.last_login;

-- -------------------------------------------------------
-- alert_with_patient_name: joins alerts with patient name from users_profile
-- -------------------------------------------------------
CREATE OR REPLACE VIEW public.alert_with_patient_name AS
SELECT
  a.*,
  CONCAT(up.first_name, ' ', up.last_name) AS patient_name
FROM public.alerts a
JOIN public.users_profile up ON up.id = a.patient_id;
