import * as clinicianModel from "@/models/clinicianModel";
import type { Clinician } from "@/types";

export function getProfile(): Clinician {
  return clinicianModel.findCurrentClinician();
}
