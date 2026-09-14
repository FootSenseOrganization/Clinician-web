import { mockRemarks } from "@/mock/mockData";
import type { Remark } from "@/types";

export function findByPatientId(patientId: string): Remark[] {
  const own = mockRemarks.filter((r) => r.patient_id === patientId);
  return own.length > 0 ? own : mockRemarks;
}
