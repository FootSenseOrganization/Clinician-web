import * as patientModel from "@/models/patientModel";
import type { Patient, RiskLevel } from "@/types";

export async function getAllPatients(clinicianId?: string): Promise<Patient[]> {
  return clinicianId ? patientModel.findByClinicianId(clinicianId) : patientModel.findAll();
}

export async function getPatientById(id: string): Promise<Patient | null> {
  return patientModel.findById(id);
}

export async function getFilteredPatients(
  search: string,
  riskFilter: "all" | RiskLevel,
  sortBy: "scan" | "name" | "score",
  clinicianId?: string,
): Promise<Patient[]> {
  const patients = clinicianId
    ? await patientModel.findByClinicianId(clinicianId)
    : await patientModel.findAll();
  const q = search.trim().toLowerCase();

  let list = patients.filter(
    (p) =>
      (!q ||
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)) &&
      (riskFilter === "all" || p.latest_risk_level === riskFilter),
  );

  list = [...list].sort((a, b) => {
    if (sortBy === "name") return a.first_name.localeCompare(b.first_name);
    if (sortBy === "score") return b.latest_risk_score - a.latest_risk_score;
    return (
      new Date(b.last_measurement ?? 0).getTime() -
      new Date(a.last_measurement ?? 0).getTime()
    );
  });

  return list;
}

export function getRiskDistribution(patients: Patient[]) {
  return {
    high: patients.filter((p) => p.latest_risk_level === "high").length,
    moderate: patients.filter((p) => p.latest_risk_level === "moderate").length,
    low: patients.filter((p) => p.latest_risk_level === "low").length,
  };
}

export function getRecentPatients(patients: Patient[], limit: number): Patient[] {
  return [...patients]
    .sort(
      (a, b) =>
        new Date(b.last_measurement ?? 0).getTime() -
        new Date(a.last_measurement ?? 0).getTime(),
    )
    .slice(0, limit);
}
