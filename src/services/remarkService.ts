import * as remarkModel from "@/models/remarkModel";
import type { Remark } from "@/types";

export async function getPatientRemarks(patientId: string): Promise<Remark[]> {
  return remarkModel.findByPatientId(patientId);
}

export async function addRemark(
  patientId: string,
  clinicianId: string,
  content: string,
): Promise<Remark> {
  return remarkModel.create(patientId, clinicianId, content);
}

export async function updateRemark(id: string, content: string): Promise<void> {
  return remarkModel.update(id, content);
}

export async function deleteRemark(id: string): Promise<void> {
  return remarkModel.remove(id);
}
