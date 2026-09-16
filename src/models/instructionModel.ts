import { supabase } from "@/lib/supabaseClient";
import type { Instruction } from "@/types";

export async function findByPatientId(patientId: string): Promise<Instruction[]> {
  const { data, error } = await supabase
    .from("instructions")
    .select("*, clinician:users_profile!clinician_id(first_name, last_name)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((i) => ({
    id: i.id,
    patient_id: i.patient_id,
    clinician_id: i.clinician_id,
    clinician_name: i.clinician
      ? `${(i.clinician as { first_name: string }).first_name} ${(i.clinician as { last_name: string }).last_name}`.trim()
      : "Unknown",
    content: i.content,
    visible_to_patient: i.visible_to_patient,
    created_at: i.created_at,
  }));
}

export async function create(
  patientId: string,
  clinicianId: string,
  content: string,
  visibleToPatient: boolean = true,
): Promise<Instruction> {
  const { data, error } = await supabase
    .from("instructions")
    .insert({
      patient_id: patientId,
      clinician_id: clinicianId,
      content,
      visible_to_patient: visibleToPatient,
    })
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
    visible_to_patient: data.visible_to_patient,
    created_at: data.created_at,
  };
}

export async function update(id: string, content: string): Promise<void> {
  const { error } = await supabase
    .from("instructions")
    .update({ content })
    .eq("id", id);
  if (error) throw error;
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase.from("instructions").delete().eq("id", id);
  if (error) throw error;
}
