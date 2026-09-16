import * as profileService from "@/services/profileService";
import type { Clinician } from "@/types";

export async function getProfileData(clinicianId: string): Promise<Clinician | null> {
  return profileService.getProfile(clinicianId);
}
