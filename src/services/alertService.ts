import * as alertModel from "@/models/alertModel";
import type { Alert } from "@/types";

export function getSortedAlerts(): Alert[] {
  return [...alertModel.findAll()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function getUnreadAlerts(): Alert[] {
  return getSortedAlerts().filter((a) => !a.acknowledged);
}

export function getUnreadCount(): number {
  return alertModel.findAll().filter((a) => !a.acknowledged).length;
}
