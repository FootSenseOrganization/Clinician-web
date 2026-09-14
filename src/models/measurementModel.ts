import { mockMeasurements } from "@/mock/mockData";
import type { Measurement } from "@/types";

export function findByPatientId(patientId: string): Measurement[] {
  const own = mockMeasurements.filter((m) => m.user_id === patientId);
  // If no measurements match the specific patient, return all measurements
  // (demo behaviour — all mock measurements are shown for any patient)
  return own.length > 0 ? own : mockMeasurements;
}
