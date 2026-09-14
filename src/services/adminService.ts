import * as applicationModel from "@/models/applicationModel";
import * as clinicianModel from "@/models/clinicianModel";
import * as patientModel from "@/models/patientModel";
import type { Application, RegisteredClinician } from "@/types";

export function getApplications(): Application[] {
  return applicationModel.findAll();
}

export function getRegisteredClinicians(): RegisteredClinician[] {
  return clinicianModel.findAllRegistered();
}

export function computeAdminStats() {
  const clinicians = clinicianModel.findAllRegistered();
  const applications = applicationModel.findAll();
  return {
    pendingApplications: applications.filter((a) => a.status === "pending").length,
    activeClinicians: clinicians.filter((c) => c.status === "active").length,
    suspendedClinicians: clinicians.filter((c) => c.status === "suspended").length,
    totalPatients: patientModel.findAll().length,
  };
}

export function getRecentApplications(limit: number): Application[] {
  return [...applicationModel.findAll()]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, limit);
}
