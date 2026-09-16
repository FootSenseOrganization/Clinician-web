import { supabase } from "@/lib/supabaseClient";
import type { Alert } from "@/types";

export async function findAll(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alert_with_patient_name")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function findByPatientId(patientId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alert_with_patient_name")
    .select("*")
    .eq("patient_id", patientId)
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function findByClinicianId(clinicianId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alert_with_patient_name")
    .select("*")
    .eq("clinician_id", clinicianId)
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function acknowledge(alertId: string): Promise<void> {
  const { error } = await supabase
    .from("alerts")
    .update({ acknowledged: true })
    .eq("id", alertId);
  if (error) throw error;
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("acknowledged", false);
  if (error) throw error;
  return count ?? 0;
}
