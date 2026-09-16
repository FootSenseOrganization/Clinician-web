import { supabase } from "@/lib/supabaseClient";
import type { Clinician, RegisteredClinician } from "@/types";

export async function findByEmail(email: string): Promise<Clinician | null> {
  const { data, error } = await supabase
    .from("clinician_summary")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findById(id: string): Promise<Clinician | null> {
  const { data, error } = await supabase
    .from("clinician_summary")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findAllRegistered(): Promise<RegisteredClinician[]> {
  const { data, error } = await supabase
    .from("clinician_summary")
    .select("*")
    .order("first_name");
  if (error) throw error;
  return data ?? [];
}

export async function updateProfile(
  id: string,
  firstName: string,
  lastName: string,
  specialty: string,
  institution: string,
): Promise<void> {
  const { error: profileError } = await supabase
    .from("users_profile")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", id);
  if (profileError) throw profileError;

  const { error: clinicianError } = await supabase
    .from("clinicians")
    .update({ specialty, institution })
    .eq("user_id", id);
  if (clinicianError) throw clinicianError;
}
