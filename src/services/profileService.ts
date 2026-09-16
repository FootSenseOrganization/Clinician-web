import * as clinicianModel from "@/models/clinicianModel";
import type { Clinician } from "@/types";

export async function getProfile(clinicianId: string): Promise<Clinician | null> {
  return clinicianModel.findById(clinicianId);
}

export async function getProfileByEmail(email: string): Promise<Clinician | null> {
  return clinicianModel.findByEmail(email);
}

export async function updateProfile(
  id: string,
  firstName: string,
  lastName: string,
  specialty: string,
  institution: string,
): Promise<void> {
  return clinicianModel.updateProfile(id, firstName, lastName, specialty, institution);
}
