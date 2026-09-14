import * as instructionModel from "@/models/instructionModel";
import type { Instruction } from "@/types";

export function getPatientInstructions(patientId: string): Instruction[] {
  return instructionModel.findByPatientId(patientId);
}
