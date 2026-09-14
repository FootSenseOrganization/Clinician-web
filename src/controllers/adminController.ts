import * as adminService from "@/services/adminService";

export function getAdminDashboardData() {
  return {
    stats: adminService.computeAdminStats(),
    recentApplications: adminService.getRecentApplications(3),
  };
}

export function getApplicationList() {
  return adminService.getApplications();
}

export function getRegisteredClinicianList() {
  return adminService.getRegisteredClinicians();
}
