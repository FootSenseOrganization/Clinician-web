import * as authService from "@/services/authService";
export type { ApplicationLookup } from "@/services/authService";

export const AHPRA_REGEX = authService.AHPRA_REGEX;

export function getCurrentUser() {
  return authService.getCurrentClinician();
}

export function lookupApplicationStatus(query: string) {
  return authService.lookupApplication(query);
}

export function validateAhpraNumber(value: string) {
  return authService.validateAhpra(value);
}
