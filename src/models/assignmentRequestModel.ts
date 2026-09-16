import { supabase } from "@/lib/supabaseClient";
import type { AssignmentRequest } from "@/types";

export async function findAll(): Promise<AssignmentRequest[]> {
  const { data, error } = await supabase
    .from("assignment_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function findByClinicianId(clinicianId: string): Promise<AssignmentRequest[]> {
  const { data, error } = await supabase
    .from("assignment_requests")
    .select("*")
    .eq("clinician_id", clinicianId)
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateStatus(id: string, status: "accepted" | "declined"): Promise<void> {
  const { error } = await supabase
    .from("assignment_requests")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}
