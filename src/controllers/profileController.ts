import * as profileService from "@/services/profileService";
import type { Clinician } from "@/types";

export async function getProfileData(clinicianId: string): Promise<Clinician | null> {
  return profileService.getProfile(clinicianId);
}

export async function updateProfile(
  id: string,
  firstName: string,
  lastName: string,
  specialty: string,
  institution: string,
): Promise<void> {
  return profileService.updateProfile(id, firstName, lastName, specialty, institution);
}
