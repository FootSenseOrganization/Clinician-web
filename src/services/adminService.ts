import * as applicationModel from "@/models/applicationModel";
import * as clinicianModel from "@/models/clinicianModel";
import * as patientModel from "@/models/patientModel";
import type { Application, RegisteredClinician } from "@/types";

export async function getApplications(): Promise<Application[]> {
  return applicationModel.findAll();
}

export async function getRegisteredClinicians(): Promise<RegisteredClinician[]> {
  return clinicianModel.findAllRegistered();
}

export async function computeAdminStats() {
  const [clinicians, applications, patients] = await Promise.all([
    clinicianModel.findAllRegistered(),
    applicationModel.findAll(),
    patientModel.findAll(),
  ]);
  return {
    pendingApplications: applications.filter((a) => a.status === "pending").length,
    activeClinicians: clinicians.filter((c) => c.status === "active").length,
    suspendedClinicians: clinicians.filter((c) => c.status === "suspended").length,
    totalPatients: patients.length,
  };
}

export async function getRecentApplications(limit: number): Promise<Application[]> {
  const apps = await applicationModel.findAll();
  return apps.slice(0, limit);
}
