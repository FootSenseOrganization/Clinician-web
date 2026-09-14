-- ============================================================
-- Migration 012: Create SQL views
-- Computed views for patient summaries, clinician counts, alert names
-- ============================================================

-- -------------------------------------------------------
-- patient_summary: adds computed risk/measurement fields
-- -------------------------------------------------------
CREATE OR REPLACE VIEW patient_summary AS
SELECT
  p.*,
  COALESCE(agg.total_measurements, 0)::integer       AS total_measurements,
  agg.last_measurement,
  COALESCE(latest.latest_risk_score, 0)::integer      AS latest_risk_score,
  COALESCE(latest.latest_risk_level, 'low')           AS latest_risk_level
FROM patients p
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::integer                AS total_measurements,
    MAX(m.timestamp)                 AS last_measurement
  FROM measurements m
  WHERE m.patient_id = p.id
) agg ON true
LEFT JOIN LATERAL (
  SELECT
    ma.risk_score   AS latest_risk_score,
    ma.risk_level   AS latest_risk_level
  FROM measurements m2
  JOIN measurement_analyses ma ON ma.measurement_id = m2.id
  WHERE m2.patient_id = p.id
  ORDER BY m2.timestamp DESC
  LIMIT 1
) latest ON true;

-- -------------------------------------------------------
-- clinician_with_patient_count: for admin management page
-- -------------------------------------------------------
CREATE OR REPLACE VIEW clinician_with_patient_count AS
SELECT
  c.*,
  COUNT(p.id)::integer AS patient_count
FROM clinicians c
LEFT JOIN patients p ON p.clinician_id = c.id
GROUP BY c.id;

-- -------------------------------------------------------
-- alert_with_patient_name: for alerts centre page
-- -------------------------------------------------------
CREATE OR REPLACE VIEW alert_with_patient_name AS
SELECT
  a.*,
  p.name AS patient_name
FROM alerts a
JOIN patients p ON p.id = a.patient_id;
