import * as patientService from "@/services/patientService";
import * as measurementService from "@/services/measurementService";
import * as remarkService from "@/services/remarkService";
import * as instructionService from "@/services/instructionService";
import type { RiskLevel } from "@/types";

export function getPatientList(
  search: string,
  riskFilter: "all" | RiskLevel,
  sortBy: "scan" | "name" | "score",
) {
  return patientService.getFilteredPatients(search, riskFilter, sortBy);
}

export function getAllPatients() {
  return patientService.getAllPatients();
}

export function getPatientDetail(id: string) {
  return patientService.getPatientById(id);
}

export function getPatientMeasurements(patientId: string) {
  return measurementService.getPatientMeasurements(patientId);
}

export function getChartData(patientId: string) {
  const measurements = measurementService.getPatientMeasurements(patientId);
  return measurementService.computeChartData(measurements);
}

export function getPatientRemarks(patientId: string) {
  return remarkService.getPatientRemarks(patientId);
}

export function getPatientInstructions(patientId: string) {
  return instructionService.getPatientInstructions(patientId);
}

export function getRiskDistribution() {
  const patients = patientService.getAllPatients();
  return patientService.getRiskDistribution(patients);
}

export function getRecentPatients(limit: number) {
  const patients = patientService.getAllPatients();
  return patientService.getRecentPatients(patients, limit);
}
