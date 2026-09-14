import * as patientModel from "@/models/patientModel";
import type { Patient, RiskLevel } from "@/types";

export function getAllPatients(): Patient[] {
  return patientModel.findAll();
}

export function getPatientById(id: string): Patient | undefined {
  return patientModel.findById(id);
}

export function getFilteredPatients(
  search: string,
  riskFilter: "all" | RiskLevel,
  sortBy: "scan" | "name" | "score",
): Patient[] {
  const patients = patientModel.findAll();
  const q = search.trim().toLowerCase();

  let list = patients.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)) &&
      (riskFilter === "all" || p.latest_risk_level === riskFilter),
  );

  list = [...list].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "score") return b.latest_risk_score - a.latest_risk_score;
    return new Date(b.last_measurement).getTime() - new Date(a.last_measurement).getTime();
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
        new Date(b.last_measurement).getTime() - new Date(a.last_measurement).getTime(),
    )
    .slice(0, limit);
}
