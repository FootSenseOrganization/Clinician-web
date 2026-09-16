import * as alertService from "@/services/alertService";
import type { Alert } from "@/types";

export async function getAllAlerts(): Promise<Alert[]> {
  return alertService.getSortedAlerts();
}

export async function getUnreadAlerts(): Promise<Alert[]> {
  return alertService.getUnreadAlerts();
}

export async function getUnreadCount(): Promise<number> {
  return alertService.getUnreadCount();
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  return alertService.acknowledgeAlert(alertId);
}
