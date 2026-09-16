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
    .order("name");
  if (error) throw error;
  return data ?? [];
}
