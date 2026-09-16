import { supabase } from "@/lib/supabaseClient";
import * as clinicianModel from "@/models/clinicianModel";
import type { Clinician } from "@/types";

export const AHPRA_REGEX = /^[A-Z]{3}[0-9]{10}$/;

export function validateAhpra(value: string): boolean {
  return AHPRA_REGEX.test(value.toUpperCase());
}

export async function getClinicianByEmail(email: string): Promise<Clinician | null> {
  return clinicianModel.findByEmail(email);
}

export async function lookupUserRole(
  email: string,
): Promise<{ role: string; id: string } | null> {
  const { data, error } = await supabase
    .from("users_profile")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ApplicationLookup =
  | { found: true; status: "pending" }
  | { found: true; status: "approved"; ahpra_number: string }
  | { found: false };

export async function lookupApplication(query: string): Promise<ApplicationLookup> {
  const q = query.trim().toLowerCase();
  if (!q) return { found: false };

  // Check if already an approved clinician
  const { data: clinicians } = await supabase
    .from("clinician_summary")
    .select("ahpra_number")
    .or(`ahpra_number.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(1);
  if (clinicians && clinicians.length > 0) {
    return { found: true, status: "approved", ahpra_number: clinicians[0]!.ahpra_number };
  }

  // Check pending applications
  const { data: apps } = await supabase
    .from("applications")
    .select("id")
    .eq("status", "pending")
    .or(`ahpra_number.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(1);
  if (apps?.length) return { found: true, status: "pending" };

  return { found: false };
}
