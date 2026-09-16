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
    .or(`ahpra_number.ilike.%${q}%,email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateStatus(
  id: string,
  status: ApplicationStatus,
  reviewedBy?: string,
  declineReason?: string,
): Promise<void> {
  const validReviewerId =
    reviewedBy &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewedBy)
      ? reviewedBy
      : null;

  if (status === "approved") {
    // 1. Try secure RPC function (which provisions user + clinician atomically)
    const { error: rpcError } = await supabase.rpc("approve_application", {
      app_id: id,
      reviewer_id: validReviewerId,
    });

    if (!rpcError) {
      return;
    }
    console.warn("approve_application RPC failed or not present, falling back to direct update:", rpcError);
  } else if (status === "declined") {
    const { error: rpcError } = await supabase.rpc("decline_application", {
      app_id: id,
      reason: declineReason ?? null,
      reviewer_id: validReviewerId,
    });

    if (!rpcError) {
      return;
    }
    console.warn("decline_application RPC failed or not present, falling back to direct update:", rpcError);
  }

  // Fallback: Direct table update
  const { data, error } = await supabase
    .from("applications")
    .update({
      status,
      reviewed_by: validReviewerId,
      reviewed_at: new Date().toISOString(),
      decline_reason: declineReason ?? null,
    })
    .eq("id", id)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Unable to update application status in the database. Please ensure migration 037 has been executed in your Supabase SQL editor.",
    );
  }
}

export async function create(
  ahpraNumber: string,
  firstName: string,
  lastName: string,
  email: string,
  specialty: string,
  institution: string,
): Promise<void> {
  const { error } = await supabase.from("applications").insert([
    {
      ahpra_number: ahpraNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      specialty,
      institution,
    },
  ]);
  if (error) throw error;
}
