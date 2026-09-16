import * as authService from "@/services/authService";
import type { Clinician } from "@/types";
export type { ApplicationLookup } from "@/services/authService";

export const AHPRA_REGEX = authService.AHPRA_REGEX;

export async function getClinicianByEmail(email: string): Promise<Clinician | null> {
  return authService.getClinicianByEmail(email);
}

export async function lookupUserRole(email: string) {
  return authService.lookupUserRole(email);
}

export async function lookupApplicationStatus(query: string) {
  return authService.lookupApplication(query);
}

export function validateAhpraNumber(value: string) {
  return authService.validateAhpra(value);
}
