import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Clinician, UserRole } from "@/types";

interface AuthState {
  role: UserRole;
  user: Clinician | null;
  loading: boolean;
  loginWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const ROLE_KEY = "footsense.role";
const EMAIL_KEY = "footsense.email";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [user, setUser] = useState<Clinician | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const storedRole = window.localStorage.getItem(ROLE_KEY) as UserRole;
    const storedEmail = window.localStorage.getItem(EMAIL_KEY);
    if (storedRole && storedEmail) {
      restoreUser(storedEmail, storedRole).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function restoreUser(email: string, savedRole: UserRole) {
    try {
      if (savedRole === "clinician") {
        const { data } = await supabase
          .from("clinician_summary")
          .select("*")
          .eq("email", email)
          .maybeSingle();
        if (data) {
          setRole("clinician");
          setUser(data as Clinician);
          return;
        }
      } else if (savedRole === "admin") {
        const { data } = await supabase
          .from("users_profile")
          .select("id, email, first_name, last_name, role")
          .eq("email", email)
          .eq("role", "admin")
          .maybeSingle();
        if (data) {
          setRole("admin");
          setUser({
            id: data.id,
            name: `${data.first_name} ${data.last_name}`.trim() || "Admin",
            email: data.email,
            specialty: "Administration",
            institution: "FootSense",
            ahpra_number: "",
            avatar_initials: (data.first_name?.[0] ?? "A") + (data.last_name?.[0] ?? ""),
            status: "active",
            last_login: new Date().toISOString(),
            created_at: "",
            patient_count: 0,
          });
          return;
        }
      }
      // Stored session invalid — clear it
      window.localStorage.removeItem(ROLE_KEY);
      window.localStorage.removeItem(EMAIL_KEY);
    } catch {
      window.localStorage.removeItem(ROLE_KEY);
      window.localStorage.removeItem(EMAIL_KEY);
    }
  }

  const loginWithEmail = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return { success: false, error: "Email is required." };

    try {
      // Look up user role from users_profile
      const { data: profile } = await supabase
        .from("users_profile")
        .select("id, email, first_name, last_name, role")
        .eq("email", trimmed)
        .maybeSingle();

      if (!profile) return { success: false, error: "No account found with this email." };

      if (profile.role === "clinician") {
        const { data: clinician } = await supabase
          .from("clinician_summary")
          .select("*")
          .eq("email", trimmed)
          .single();
        if (!clinician) return { success: false, error: "Clinician profile not found." };
        setRole("clinician");
        setUser(clinician as Clinician);
        window.localStorage.setItem(ROLE_KEY, "clinician");
        window.localStorage.setItem(EMAIL_KEY, trimmed);
        return { success: true };
      }

      if (profile.role === "admin") {
        setRole("admin");
        setUser({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`.trim() || "Admin",
          email: profile.email,
          specialty: "Administration",
          institution: "FootSense",
          ahpra_number: "",
          avatar_initials: (profile.first_name?.[0] ?? "A") + (profile.last_name?.[0] ?? ""),
          status: "active",
          last_login: new Date().toISOString(),
          created_at: "",
          patient_count: 0,
        });
        window.localStorage.setItem(ROLE_KEY, "admin");
        window.localStorage.setItem(EMAIL_KEY, trimmed);
        return { success: true };
      }

      return { success: false, error: "This account does not have clinician or admin access." };
    } catch (err) {
      return { success: false, error: "Login failed. Please try again." };
    }
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    setUser(null);
    window.localStorage.removeItem(ROLE_KEY);
    window.localStorage.removeItem(EMAIL_KEY);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ role, user, loading, loginWithEmail, logout }),
    [role, user, loading, loginWithEmail, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
