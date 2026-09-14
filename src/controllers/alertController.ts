import * as alertService from "@/services/alertService";

export function getAllAlerts() {
  return alertService.getSortedAlerts();
}

export function getUnreadAlerts() {
  return alertService.getUnreadAlerts();
}

export function getUnreadCount() {
  return alertService.getUnreadCount();
}
