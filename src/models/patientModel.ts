import { supabase } from "@/lib/supabaseClient";
import type { Patient } from "@/types";

export async function findAll(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patient_summary")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function findById(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from("patient_summary")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findByClinicianId(clinicianId: string): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patient_summary")
    .select("*")
    .eq("clinician_id", clinicianId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}
