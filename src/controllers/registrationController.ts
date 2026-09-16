import { AHPRA_REGEX } from "@/services/authService";

export type RegistrationFormErrors = {
  ahpra?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  institution?: string;
};

export function validateRegistrationForm(form: {
  ahpra: string;
  firstName: string;
  lastName: string;
  email: string;
  institution: string;
}): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  if (!AHPRA_REGEX.test(form.ahpra.toUpperCase())) {
    errors.ahpra = "Must be 3 letters followed by 10 digits (e.g., MED0000932846).";
  }
  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.institution.trim()) {
    errors.institution = "Institution is required.";
  }

  return errors;
}

export async function submitApplication(
  ahpra: string,
  firstName: string,
  lastName: string,
  email: string,
  specialty: string,
  institution: string,
): Promise<void> {
  const { create } = await import("@/models/applicationModel");
  await create(ahpra, firstName, lastName, email, specialty, institution);
}
