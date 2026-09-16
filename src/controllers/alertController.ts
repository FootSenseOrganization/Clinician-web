import * as alertService from "@/services/alertService";
import type { Alert } from "@/types";

export async function getAllAlerts(clinicianId?: string): Promise<Alert[]> {
  return alertService.getSortedAlerts(clinicianId);
}

export async function getUnreadAlerts(clinicianId?: string): Promise<Alert[]> {
  return alertService.getUnreadAlerts(clinicianId);
}

export async function getUnreadCount(): Promise<number> {
  return alertService.getUnreadCount();
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  return alertService.acknowledgeAlert(alertId);
}
