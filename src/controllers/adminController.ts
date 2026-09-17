import * as adminService from "@/services/adminService";
import * as applicationModel from "@/models/applicationModel";
import type { Application, ApplicationStatus, RegisteredClinician } from "@/types";

export async function getAdminDashboardData() {
  const [stats, recentApplications] = await Promise.all([
    adminService.computeAdminStats(),
    adminService.getRecentApplications(3),
  ]);
  return { stats, recentApplications };
}

export async function getApplicationList(): Promise<Application[]> {
  return adminService.getApplications();
}

export async function getRegisteredClinicianList(): Promise<RegisteredClinician[]> {
  return adminService.getRegisteredClinicians();
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  reviewedBy: string,
  declineReason?: string,
): Promise<void> {
  return applicationModel.updateStatus(id, status, reviewedBy, declineReason);
}

export async function promoteClinicianToAdmin(userId: string): Promise<void> {
  return adminService.promoteClinicianToAdmin(userId);
}

export async function demoteAdminToClinician(userId: string): Promise<void> {
  return adminService.demoteAdminToClinician(userId);
}

export async function updateClinicianStatus(
  userId: string,
  status: "active" | "suspended",
): Promise<void> {
  return adminService.updateClinicianStatus(userId, status);
}



