import * as instructionModel from "@/models/instructionModel";
import type { Instruction } from "@/types";

export async function getPatientInstructions(patientId: string): Promise<Instruction[]> {
  return instructionModel.findByPatientId(patientId);
}

export async function addInstruction(
  patientId: string,
  clinicianId: string,
  content: string,
  visibleToPatient: boolean = true,
): Promise<Instruction> {
  return instructionModel.create(patientId, clinicianId, content, visibleToPatient);
}

export async function updateInstruction(id: string, content: string): Promise<void> {
  return instructionModel.update(id, content);
}

export async function deleteInstruction(id: string): Promise<void> {
  return instructionModel.remove(id);
}
