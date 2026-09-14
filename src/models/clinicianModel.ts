import { mockClinician, mockRegisteredClinicians } from "@/mock/mockData";
import type { Clinician, RegisteredClinician } from "@/types";

export function findCurrentClinician(): Clinician {
  return mockClinician;
}

export function findAllRegistered(): RegisteredClinician[] {
  return mockRegisteredClinicians;
}
