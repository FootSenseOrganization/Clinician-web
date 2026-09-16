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

const heatmapsBucket = import.meta.env["VITE_SUPABASE_HEATMAPS_BUCKET"] || "footsense-heatmaps";

function getStorageUrl(filename: string): string {
  const cleanName = filename.replace(/\?+$/, "");
  const { data } = supabase.storage.from(heatmapsBucket).getPublicUrl(cleanName);
  return data?.publicUrl ?? "";
}

function resolveThermalImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (!trimmed) return "";

  // Strip trailing question marks (e.g. "...raw.png?")
  trimmed = trimmed.replace(/\?+$/, "");

  // Replace mock / local testserver URLs with bucket URL via Supabase SDK
  if (trimmed.includes("testserver/static/images/")) {
    const filename = trimmed.split("/").pop();
    return filename ? getStorageUrl(filename) : "";
  }

  // If it's a bare filename like "cc5f4584d208_detected_9pts.png"
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && trimmed.includes(".png")) {
    return getStorageUrl(trimmed);
  }

  return trimmed;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Measurement {
  const analysis = mapAnalysis(row.analysis as Record<string, unknown> | null);

  // Each scan has a single composite dual-foot image (Left & Right feet together).
  // There are no separate left and right image URLs.
  const rawImages = (row.images && typeof row.images === "object") ? row.images : {};

  const detectedUrl = resolveThermalImageUrl(
    rawImages.detected_9pts_url || rawImages.detected_9pts || ""
  );
  const roomCalibratedUrl = resolveThermalImageUrl(
    rawImages.room_calibrated_url || rawImages.room_calibrated || ""
  );
  const rawUrl = resolveThermalImageUrl(
    rawImages.raw_url || rawImages.raw || ""
  );

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
    images: {
      detected_9pts_url: detectedUrl,
      room_calibrated_url: roomCalibratedUrl,
      raw_url: rawUrl,
    },
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function findByPatientId(patientId: string): Promise<Measurement[]> {
  // Try security-definer RPC first to ensure clean access
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_patient_measurements_definer",
      { p_patient_id: patientId }
    );
    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData.map(mapRow);
    }
  } catch {
    // If RPC is not present yet in Supabase, smoothly proceed to direct table query
  }

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
