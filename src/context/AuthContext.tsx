import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { queryClient } from "@/lib/queryClient";
import type { Clinician, UserRole } from "@/types";

interface AuthState {
  role: UserRole;
  user: Clinician | null;
  loading: boolean;
  isAuthenticated: boolean;
  authEmail: string | null;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<Clinician>) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const ADMIN_EMAIL = "foot.sense.monash@gmail.com";
const SESSION_CACHE_KEY = "footsense_session_cache";

interface CachedSession {
  role: UserRole;
  user: Clinician | null;
  authEmail: string | null;
}

function getCachedSession(): CachedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function setCachedSession(data: CachedSession | null) {
  try {
    if (data) {
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
    } else {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize synchronously from session cache to provide 0ms instant dashboard loads on refresh
  const initialCache = useMemo(() => getCachedSession(), []);

  const [role, setRole] = useState<UserRole>(initialCache?.role ?? null);
  const [user, setUser] = useState<Clinician | null>(initialCache?.user ?? null);
  const [loading, setLoading] = useState(!initialCache);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialCache?.user);
  const [authEmail, setAuthEmail] = useState<string | null>(initialCache?.authEmail ?? null);

  async function resolveUser(email: string, retryOnFailure = true): Promise<boolean> {
    const trimmed = email.trim().toLowerCase();

    // 1. Primary: Call dedicated self-healing RPC function
    try {
      const { data, error } = await supabase.rpc("get_current_user_profile");
      if (!error && data && data.role && data.user) {
        const resolvedRole = data.role as UserRole;
        const resolvedUser = data.user as Clinician;
        setRole(resolvedRole);
        setUser(resolvedUser);
        setCachedSession({ role: resolvedRole, user: resolvedUser, authEmail: trimmed });
        return true;
      }
    } catch {
      // Fallback if migration 038 RPC is not yet applied
    }

    // 2. Client-side fallback: Query clinician_summary with case-insensitive ilike
    try {
      const { data: clinician } = await supabase
        .from("clinician_summary")
        .select("*")
        .ilike("email", trimmed)
        .maybeSingle();

      if (clinician) {
        setRole("clinician");
        setUser(clinician as Clinician);
        setCachedSession({ role: "clinician", user: clinician as Clinician, authEmail: trimmed });
        return true;
      }
    } catch {
      // Fallback to direct table query
    }

    // 3. Client-side fallback: Query users_profile with case-insensitive ilike
    try {
      const { data: profile } = await supabase
        .from("users_profile")
        .select("id, email, first_name, last_name, role")
        .ilike("email", trimmed)
        .maybeSingle();

      if (profile) {
        if (profile.role === "admin") {
          const adminUser: Clinician = {
            id: profile.id,
            first_name: profile.first_name || "Admin",
            last_name: profile.last_name || "",
            email: profile.email,
            specialty: "Administration",
            institution: "FootSense",
            ahpra_number: "",
            status: "active",
            last_login: new Date().toISOString(),
            created_at: "",
            patient_count: 0,
          };
          setRole("admin");
          setUser(adminUser);
          setCachedSession({ role: "admin", user: adminUser, authEmail: trimmed });
          return true;
        }

        if (profile.role === "clinician") {
          const clinicianUser: Clinician = {
            id: profile.id,
            first_name: profile.first_name || "Clinician",
            last_name: profile.last_name || "",
            email: profile.email,
            specialty: "Podiatry",
            institution: "FootSense Clinical Health",
            ahpra_number: "",
            status: "active",
            last_login: new Date().toISOString(),
            created_at: "",
            patient_count: 0,
          };
          setRole("clinician");
          setUser(clinicianUser);
          setCachedSession({ role: "clinician", user: clinicianUser, authEmail: trimmed });
          return true;
        }
      }
    } catch {}

    // 4. Hardcoded Admin Email Fallback
    if (trimmed === ADMIN_EMAIL.toLowerCase()) {
      const fallbackAdmin: Clinician = {
        id: "admin-fallback",
        first_name: "Platform",
        last_name: "Administrator",
        email: ADMIN_EMAIL,
        specialty: "Administration",
        institution: "FootSense",
        ahpra_number: "",
        status: "active",
        last_login: new Date().toISOString(),
        created_at: "",
        patient_count: 0,
      };
      setRole("admin");
      setUser(fallbackAdmin);
      setCachedSession({ role: "admin", user: fallbackAdmin, authEmail: trimmed });
      return true;
    }

    // 5. Transient Delay Retry: If initial resolution failed right after Google OAuth,
    // wait 500ms and try once more before declaring not found.
    if (retryOnFailure) {
      await new Promise((r) => setTimeout(r, 500));
      return resolveUser(email, false);
    }

    setRole(null);
    setUser(null);
    setCachedSession(null);
    return false;
  }

  useEffect(() => {
    let isMounted = true;

    // Single synchronized auth listener handling INITIAL_SESSION, SIGNED_IN, and SIGNED_OUT
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session?.user?.email) {
        setCachedSession(null);
        queryClient.clear();
        setIsAuthenticated(false);
        setAuthEmail(null);
        setRole(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const email = session.user.email;
      setIsAuthenticated(true);
      setAuthEmail(email);

      await resolveUser(email, true);

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = useCallback(async (redirectPath?: string) => {
    const redirectTo = window.location.origin + (redirectPath ?? window.location.pathname);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }

    // Wipe all session storage and in-memory query cache
    setCachedSession(null);
    queryClient.clear();

    setRole(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthEmail(null);
  }, []);

  const updateUser = useCallback((updatedFields: Partial<Clinician>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      setCachedSession({ role, user: updated, authEmail });
      return updated;
    });
  }, [role, authEmail]);

  const value = useMemo<AuthState>(
    () => ({ role, user, loading, isAuthenticated, authEmail, signInWithGoogle, logout, updateUser }),
    [role, user, loading, isAuthenticated, authEmail, signInWithGoogle, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
