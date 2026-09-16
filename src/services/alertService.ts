import * as alertModel from "@/models/alertModel";
import type { Alert } from "@/types";

export async function getSortedAlerts(clinicianId?: string): Promise<Alert[]> {
  return clinicianId ? alertModel.findByClinicianId(clinicianId) : alertModel.findAll();
}

export async function getUnreadAlerts(clinicianId?: string): Promise<Alert[]> {
  const all = clinicianId
    ? await alertModel.findByClinicianId(clinicianId)
    : await alertModel.findAll();
  return all.filter((a) => !a.acknowledged);
}

export async function getUnreadCount(): Promise<number> {
  return alertModel.getUnreadCount();
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  return alertModel.acknowledge(alertId);
}
