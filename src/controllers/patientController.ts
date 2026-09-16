import * as patientService from "@/services/patientService";
import * as measurementService from "@/services/measurementService";
import * as remarkService from "@/services/remarkService";
import * as instructionService from "@/services/instructionService";
import type { RiskLevel, Remark, Instruction, Measurement, Patient } from "@/types";

export async function getPatientList(
  search: string,
  riskFilter: "all" | RiskLevel,
  sortBy: "scan" | "name" | "score",
  clinicianId?: string,
): Promise<Patient[]> {
  return patientService.getFilteredPatients(search, riskFilter, sortBy, clinicianId);
}

export async function getAllPatients(clinicianId?: string): Promise<Patient[]> {
  return patientService.getAllPatients(clinicianId);
}

export async function getPatientDetail(id: string): Promise<Patient | null> {
  return patientService.getPatientById(id);
}

export async function getPatientMeasurements(patientId: string): Promise<Measurement[]> {
  return measurementService.getPatientMeasurements(patientId);
}

export function getChartData(measurements: Measurement[]) {
  return measurementService.computeChartData(measurements);
}

export async function getPatientRemarks(patientId: string): Promise<Remark[]> {
  return remarkService.getPatientRemarks(patientId);
}

export async function addRemark(
  patientId: string,
  clinicianId: string,
  content: string,
): Promise<Remark> {
  return remarkService.addRemark(patientId, clinicianId, content);
}

export async function updateRemark(id: string, content: string): Promise<void> {
  return remarkService.updateRemark(id, content);
}

export async function deleteRemark(id: string): Promise<void> {
  return remarkService.deleteRemark(id);
}

export async function getPatientInstructions(patientId: string): Promise<Instruction[]> {
  return instructionService.getPatientInstructions(patientId);
}

export async function addInstruction(
  patientId: string,
  clinicianId: string,
  content: string,
): Promise<Instruction> {
  return instructionService.addInstruction(patientId, clinicianId, content);
}

export async function updateInstruction(id: string, content: string): Promise<void> {
  return instructionService.updateInstruction(id, content);
}

export async function deleteInstruction(id: string): Promise<void> {
  return instructionService.deleteInstruction(id);
}

export async function getRiskDistribution() {
  const patients = await patientService.getAllPatients();
  return patientService.getRiskDistribution(patients);
}

export async function getRecentPatients(limit: number): Promise<Patient[]> {
  const patients = await patientService.getAllPatients();
  return patientService.getRecentPatients(patients, limit);
}
