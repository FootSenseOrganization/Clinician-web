import { supabase } from "@/lib/supabaseClient";
import type { Patient, RiskLevel } from "@/types";

function deriveRiskScore(maxAsym: number): number {
  return Math.min(100, Math.round((maxAsym / 10) * 100));
}

function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

/**
 * Self-healing patient risk score enricher.
 * If the database view returned 0 for latest_risk_score because analysis JSONB
 * lacked 'risk_score', we calculate it directly from the patient's latest measurement asymmetry.
 */
async function enrichPatients(patients: Patient[]): Promise<Patient[]> {
  const needsEnrichment = patients.filter(
    (p) => p.total_measurements > 0 && p.latest_risk_score === 0
  );

  if (needsEnrichment.length === 0) return patients;

  try {
    const ids = needsEnrichment.map((p) => p.id);
    const { data: measurements } = await supabase
      .from("measurements")
      .select("user_id, max_asymmetry_celsius, analysis, timestamp")
      .in("user_id", ids)
      .order("timestamp", { ascending: false });

    if (!measurements || measurements.length === 0) return patients;

    // Pick the latest measurement per patient
    const latestByUser = new Map<string, number>();
    for (const m of measurements) {
      if (!latestByUser.has(m.user_id)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawAnalysis = m.analysis as any;
        const asym =
          (m.max_asymmetry_celsius as number) ??
          (rawAnalysis?.max_asymmetry_celsius as number) ??
          0;
        latestByUser.set(m.user_id, asym);
      }
    }

    return patients.map((p) => {
      const maxAsym = latestByUser.get(p.id);
      if (maxAsym !== undefined && maxAsym > 0) {
        const score = deriveRiskScore(maxAsym);
        return {
          ...p,
          latest_risk_score: score,
          latest_risk_level: deriveRiskLevel(score),
        };
      }
      return p;
    });
  } catch {
    return patients;
  }
}

export async function findAll(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patient_summary")
    .select("*")
    .order("first_name");
  if (error) throw error;
  return enrichPatients(data ?? []);
}

export async function findById(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from("patient_summary")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const enriched = await enrichPatients([data]);
  return enriched[0] ?? null;
}

export async function findByClinicianId(clinicianId: string): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patient_summary")
    .select("*")
    .eq("clinician_id", clinicianId)
    .order("first_name");
  if (error) throw error;
  return enrichPatients(data ?? []);
}
