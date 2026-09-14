import { AHPRA_REGEX } from "@/services/authService";

export type RegistrationFormErrors = {
  ahpra?: string;
  name?: string;
  email?: string;
  institution?: string;
};

export function validateRegistrationForm(form: {
  ahpra: string;
  name: string;
  email: string;
  institution: string;
}): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  if (!AHPRA_REGEX.test(form.ahpra.toUpperCase())) {
    errors.ahpra = "Must be 3 letters followed by 10 digits (e.g., MED0000932846).";
  }
  if (!form.name.trim()) {
    errors.name = "Full name is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.institution.trim()) {
    errors.institution = "Institution is required.";
  }

  return errors;
}
