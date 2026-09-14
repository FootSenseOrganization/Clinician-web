import * as remarkModel from "@/models/remarkModel";
import type { Remark } from "@/types";

export function getPatientRemarks(patientId: string): Remark[] {
  return remarkModel.findByPatientId(patientId);
}
