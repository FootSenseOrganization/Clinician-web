import { mockAlerts } from "@/mock/mockData";
import type { Alert } from "@/types";

export function findAll(): Alert[] {
  return mockAlerts;
}

export function findByPatientId(patientId: string): Alert[] {
  return mockAlerts.filter((a) => a.patient_id === patientId);
}
