import { supabase } from "@/lib/supabaseClient";
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

export async function promoteClinicianToAdmin(userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("promote_clinician_to_admin", {
    target_user_id: userId,
  });
  if (error) throw error;
  if (data && !data.success) {
    throw new Error(data.error || "Failed to promote clinician to admin");
  }
}

export async function demoteAdminToClinician(userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("demote_admin_to_clinician", {
    target_user_id: userId,
  });
  if (error) throw error;
  if (data && !data.success) {
    throw new Error(data.error || "Failed to demote admin to clinician");
  }
}

export async function updateClinicianStatus(
  userId: string,
  status: "active" | "suspended",
): Promise<void> {
  const { data, error } = await supabase.rpc("set_clinician_status", {
    target_user_id: userId,
    new_status: status,
  });

  if (!error) {
    if (data && !data.success) {
      throw new Error(data.error || "Failed to update clinician status.");
    }
    return;
  }

  // Fallback direct table update if migration RPC is not yet loaded
  const { error: directError } = await supabase
    .from("clinicians")
    .update({ status })
    .eq("user_id", userId);
  if (directError) {
    throw new Error(error.message || directError.message || "Failed to update clinician status.");
  }
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

