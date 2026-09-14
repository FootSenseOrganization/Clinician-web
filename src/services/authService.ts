import * as applicationModel from "@/models/applicationModel";
import * as clinicianModel from "@/models/clinicianModel";
import type { Application, Clinician } from "@/types";

export const AHPRA_REGEX = /^[A-Z]{3}[0-9]{10}$/;

export function validateAhpra(value: string): boolean {
  return AHPRA_REGEX.test(value.toUpperCase());
}

export function getCurrentClinician(): Clinician {
  return clinicianModel.findCurrentClinician();
}

export type ApplicationLookup =
  | { found: true; status: "pending"; application: Application }
  | { found: true; status: "approved"; ahpra_number: string }
  | { found: false };

export function lookupApplication(query: string): ApplicationLookup {
  const q = query.trim().toLowerCase();
  if (!q) return { found: false };

  const clinician = clinicianModel.findCurrentClinician();
  if (
    q === clinician.ahpra_number.toLowerCase() ||
    q === clinician.email.toLowerCase()
  ) {
    return { found: true, status: "approved", ahpra_number: clinician.ahpra_number };
  }

  const app = applicationModel.findByAhpraOrEmail(q);
  if (app) return { found: true, status: "pending", application: app };

  return { found: false };
}
