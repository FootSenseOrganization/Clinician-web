import { supabase } from "@/lib/supabaseClient";
import type { Measurement, MeasurementAnalysis, RiskLevel } from "@/types";

// ─── JSONB → Typed Mapper ─────────────────────────────────────────────────────

function deriveRiskScore(maxAsym: number): number {
  return Math.min(100, Math.round((maxAsym / 10) * 100));
}

function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnalysis(raw: any): MeasurementAnalysis {
  const maxAsym = (raw?.max_asymmetry_celsius as number) ?? 0;
  const zoneAsym: Record<string, number> = (raw?.zone_asymmetry as Record<string, number>) ?? {};
  const hotspotZones = Object.entries(zoneAsym)
    .filter(([, v]) => v > 2)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);
  const riskScore = deriveRiskScore(maxAsym);

  return {
    max_asymmetry_celsius: maxAsym,
    alert_triggered: (raw?.alert_triggered as boolean) ?? false,
    alert_severity: (raw?.alert_severity as string) ?? null,
    clinical_points_left: (raw?.clinical_points_left as MeasurementAnalysis["clinical_points_left"]) ?? [],
    clinical_points_right: (raw?.clinical_points_right as MeasurementAnalysis["clinical_points_right"]) ?? [],
    zone_asymmetry: zoneAsym,
    calibrated_left: (raw?.calibrated_left as number[][]) ?? [],
    calibrated_right: (raw?.calibrated_right as number[][]) ?? [],
    risk_score: riskScore,
    risk_level: deriveRiskLevel(riskScore),
    hotspot_detected: hotspotZones.length > 0,
    hotspot_zones: hotspotZones,
    asymmetry_zone: hotspotZones[0] ?? "None",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Measurement {

  const analysis = mapAnalysis(row.analysis as Record<string, unknown> | null);
  const images = (row.images as Measurement["images"]) ?? {
    detected_9pts_url: "",
    room_calibrated_url: "",
    raw_url: "",
  };
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    timestamp: row.timestamp as string,
    notes: row.notes as string | null,
    room_temp_start_celsius: row.room_temp_start_celsius as number | null,
    room_temp_end_celsius: row.room_temp_end_celsius as number | null,
    max_asymmetry_celsius: row.max_asymmetry_celsius as number | null,
    alert_triggered: row.alert_triggered as boolean,
    alert_severity: row.alert_severity as string | null,
    analysis,
    clinical_points: {
      left: analysis.clinical_points_left,
      right: analysis.clinical_points_right,
    },
    images,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function findByPatientId(patientId: string): Promise<Measurement[]> {
  const { data, error } = await supabase
    .from("measurements")
    .select("*")
    .eq("user_id", patientId)
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function findById(id: string): Promise<Measurement | null> {
  const { data, error } = await supabase
    .from("measurements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}
