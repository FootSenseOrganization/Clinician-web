import { supabase } from "@/lib/supabaseClient";
import type { Application, ApplicationStatus } from "@/types";

export async function findAll(): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function findByAhpraOrEmail(query: string): Promise<Application[]> {
  const q = query.toLowerCase();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .or(`ahpra_number.ilike.%${q}%,email.ilike.%${q}%,full_name.ilike.%${q}%`)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateStatus(
  id: string,
  status: ApplicationStatus,
  reviewedBy: string,
  declineReason?: string,
): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      decline_reason: declineReason ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}
