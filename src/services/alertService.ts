import * as alertModel from "@/models/alertModel";
import type { Alert } from "@/types";

export async function getSortedAlerts(): Promise<Alert[]> {
  return alertModel.findAll(); // already sorted DESC by model
}

export async function getUnreadAlerts(): Promise<Alert[]> {
  const all = await alertModel.findAll();
  return all.filter((a) => !a.acknowledged);
}

export async function getUnreadCount(): Promise<number> {
  return alertModel.getUnreadCount();
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  return alertModel.acknowledge(alertId);
}
