import { mockInstructions } from "@/mock/mockData";
import type { Instruction } from "@/types";

export function findByPatientId(patientId: string): Instruction[] {
  const own = mockInstructions.filter((i) => i.patient_id === patientId);
  return own.length > 0 ? own : mockInstructions;
}
