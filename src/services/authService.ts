import { supabase } from "@/lib/supabaseClient";
import * as clinicianModel from "@/models/clinicianModel";
import type { Clinician } from "@/types";

export const AHPRA_REGEX = /^[A-Z]{3}[0-9]{10}$/;

export function validateAhpra(value: string): boolean {
  return AHPRA_REGEX.test(value.toUpperCase());
}

export async function getClinicianByEmail(email: string): Promise<Clinician | null> {
  return clinicianModel.findByEmail(email);
}

export async function lookupUserRole(
  email: string,
): Promise<{ role: string; id: string } | null> {
  const { data, error } = await supabase
    .from("users_profile")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ApplicationLookup =
  | { found: true; status: "pending" }
  | { found: true; status: "approved"; ahpra_number: string }
  | { found: true; status: "declined"; reason?: string }
  | { found: false };

export async function lookupApplication(query: string): Promise<ApplicationLookup> {
  const q = query.trim().toLowerCase();
  if (!q) return { found: false };

  // 1. Try RPC lookup first (bypasses any RLS restrictions cleanly via SECURITY DEFINER)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "lookup_application_status",
      { query_text: q },
    );
    if (!rpcError && rpcData && rpcData.length > 0 && rpcData[0].found) {
      const res = rpcData[0];
      if (res.status === "approved") {
        return { found: true, status: "approved", ahpra_number: res.ahpra_number || query.toUpperCase() };
      }
      if (res.status === "pending") {
        return { found: true, status: "pending" };
      }
      if (res.status === "declined") {
        return { found: true, status: "declined", reason: res.decline_reason || undefined };
      }
    }
  } catch {
    // fallback to direct table queries
  }

  // 2. Check if already an approved clinician in clinician_summary
  try {
    const { data: clinicians } = await supabase
      .from("clinician_summary")
      .select("ahpra_number")
      .or(`ahpra_number.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(1);
    if (clinicians && clinicians.length > 0) {
      return { found: true, status: "approved", ahpra_number: clinicians[0]!.ahpra_number };
    }
  } catch {}

  // 3. Check applications table directly
  try {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, status, ahpra_number, decline_reason")
      .or(`ahpra_number.ilike.%${q}%,email.ilike.%${q}%`)
      .order("submitted_at", { ascending: false })
      .limit(1);

    if (apps && apps.length > 0 && apps[0]) {
      const app = apps[0];
      if (app.status === "approved") {
        return { found: true, status: "approved", ahpra_number: app.ahpra_number || query.toUpperCase() };
      }
      if (app.status === "declined") {
        return { found: true, status: "declined", reason: app.decline_reason || undefined };
      }
      return { found: true, status: "pending" };
    }
  } catch {}

  return { found: false };
}
