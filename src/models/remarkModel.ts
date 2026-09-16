import { supabase } from "@/lib/supabaseClient";
import type { Remark } from "@/types";

export async function findByPatientId(patientId: string): Promise<Remark[]> {
  const { data, error } = await supabase
    .from("remarks")
    .select("*, clinician:users_profile!clinician_id(first_name, last_name)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    patient_id: r.patient_id,
    clinician_id: r.clinician_id,
    clinician_name: r.clinician
      ? `${(r.clinician as { first_name: string }).first_name} ${(r.clinician as { last_name: string }).last_name}`.trim()
      : "Unknown",
    content: r.content,
    created_at: r.created_at,
    updated_at: r.updated_at,
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
    .select("*, clinician:users_profile!clinician_id(first_name, last_name)")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    patient_id: data.patient_id,
    clinician_id: data.clinician_id,
    clinician_name: data.clinician
      ? `${(data.clinician as { first_name: string }).first_name} ${(data.clinician as { last_name: string }).last_name}`.trim()
      : "Unknown",
    content: data.content,
    created_at: data.created_at,
    updated_at: data.updated_at,
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
