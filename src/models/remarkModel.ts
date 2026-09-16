import { supabase } from "@/lib/supabaseClient";
import type { Remark } from "@/types";

export async function findByPatientId(patientId: string): Promise<Remark[]> {
  const { data, error } = await supabase
    .from("remarks")
    .select("*, users_profile!clinician_id(first_name, last_name)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    clinician_first_name: r.users_profile?.first_name ?? "Unknown",
    clinician_last_name: r.users_profile?.last_name ?? "Clinician",
  }));
}

export async function create(
  patientId: string,
  clinicianId: string,
  content: string,
): Promise<Remark> {
  const { data, error } = await supabase
    .from("remarks")
    .insert({ patient_id: patientId, clinician_id: clinicianId, content })
    .select("*, users_profile!clinician_id(first_name, last_name)")
    .single();
  if (error) throw error;
  const row = data as any;
  return {
    ...row,
    clinician_first_name: row.users_profile?.first_name ?? "Unknown",
    clinician_last_name: row.users_profile?.last_name ?? "Clinician",
  };
}

export async function update(id: string, content: string): Promise<void> {
  const { error } = await supabase
    .from("remarks")
    .update({ content })
    .eq("id", id);
  if (error) throw error;
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase.from("remarks").delete().eq("id", id);
  if (error) throw error;
}
