import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { queryClient } from "@/lib/queryClient";
import { lookupApplication } from "@/services/authService";
import type { Clinician, UserRole } from "@/types";

interface AuthState {
  role: UserRole;
  user: Clinician | null;
  loading: boolean;
  isAuthenticated: boolean;
  authEmail: string | null;
  authError: string | null;
  roles: ("admin" | "clinician")[];
  isAdmin: boolean;
  isClinician: boolean;
  isMultiRole: boolean;
  isRootAdmin: boolean;
  activeRole: UserRole;
  switchRole: (targetRole: "admin" | "clinician") => void;
  clearAuthError: () => void;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<Clinician>) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const ADMIN_EMAIL = "foot.sense.monash@gmail.com";
const SESSION_CACHE_KEY = "footsense_session_cache";

interface CachedSession {
  role: UserRole;
  roles: ("admin" | "clinician")[];
  activeRole: UserRole;
  user: Clinician | null;
  authEmail: string | null;
}

function getCachedSession(): CachedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === "clinician" || parsed.role === "admin")) {
        if (parsed.user?.status === "suspended" && !parsed.roles?.includes("admin")) {
          sessionStorage.removeItem(SESSION_CACHE_KEY);
          return null;
        }
        return parsed;
      }
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    }
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

  const [roles, setRoles] = useState<("admin" | "clinician")[]>(
    initialCache?.roles ?? (initialCache?.role ? [initialCache.role as "admin" | "clinician"] : []),
  );
  const [activeRole, setActiveRole] = useState<UserRole>(
    initialCache?.activeRole ?? initialCache?.role ?? null,
  );
  const [role, setRole] = useState<UserRole>(
    initialCache?.activeRole ?? initialCache?.role ?? null,
  );
  const [user, setUser] = useState<Clinician | null>(initialCache?.user ?? null);
  const [loading, setLoading] = useState(!initialCache);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialCache?.user);
  const [authEmail, setAuthEmail] = useState<string | null>(initialCache?.authEmail ?? null);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAdmin = useMemo(() => roles.includes("admin"), [roles]);
  const isClinician = useMemo(() => roles.includes("clinician"), [roles]);
  const isMultiRole = useMemo(() => isAdmin && isClinician, [isAdmin, isClinician]);
  const isRootAdmin = useMemo(
    () => authEmail?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    [authEmail],
  );

  const switchRole = useCallback((targetRole: "admin" | "clinician") => {
    if (!roles.includes(targetRole)) return;
    setActiveRole(targetRole);
    setRole(targetRole);
    if (user) {
      setCachedSession({
        role: targetRole,
        activeRole: targetRole,
        roles,
        user,
        authEmail,
      });
    }
  }, [roles, user, authEmail]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  async function resolveUser(email: string, retryOnFailure = true): Promise<boolean> {
    const trimmed = email.trim().toLowerCase();

    // 1. Primary: Call dedicated self-healing RPC function
    try {
      const { data, error } = await supabase.rpc("get_current_user_profile");
      if (!error && data && data.user) {
        const isSuspended = data.user.status === "suspended";
        const hasAdmin = Boolean(
          data.is_admin ||
          trimmed === ADMIN_EMAIL.toLowerCase() ||
          trimmed === "e20069@eng.pdn.ac.lk"
        );

        if (isSuspended && !hasAdmin) {
          setCachedSession(null);
          queryClient.clear();
          setIsAuthenticated(false);
          setAuthEmail(null);
          setRoles([]);
          setActiveRole(null);
          setRole(null);
          setUser(null);
          setAuthError(
            "Your clinician account has been suspended by an administrator. Access to patient records and clinical features is disabled."
          );
          return false;
        }

        const rawRoles = Array.isArray(data.roles) && data.roles.length > 0
          ? (data.roles as ("admin" | "clinician")[])
          : (data.role ? [data.role as "admin" | "clinician"] : []);

        const activeRoles = isSuspended
          ? rawRoles.filter((r) => r !== "clinician")
          : rawRoles;

        const resolvedRoles: ("admin" | "clinician")[] = trimmed === "e20069@eng.pdn.ac.lk"
          ? (activeRoles.includes("admin") ? activeRoles : [...activeRoles, "admin"])
          : activeRoles;

        if (resolvedRoles.length > 0) {
          let chosenRole: "admin" | "clinician" = activeRole as any;
          if (!chosenRole || !resolvedRoles.includes(chosenRole)) {
            if (window.location.pathname.startsWith("/admin") && resolvedRoles.includes("admin")) {
              chosenRole = "admin";
            } else if (resolvedRoles.includes("clinician")) {
              chosenRole = "clinician";
            } else {
              chosenRole = resolvedRoles[0] || "admin";
            }
          }

          const resolvedUser = data.user as Clinician;
          setRoles(resolvedRoles);
          setActiveRole(chosenRole);
          setRole(chosenRole);
          setUser(resolvedUser);
          setCachedSession({
            role: chosenRole,
            activeRole: chosenRole,
            roles: resolvedRoles,
            user: resolvedUser,
            authEmail: trimmed,
          });
          setAuthError(null);
          return true;
        }
      }
    } catch {
      // Fallback if migration RPC is not yet applied
    }

    // 2. Client-side fallback: Query clinician_summary with case-insensitive ilike
    try {
      const { data: clinician } = await supabase
        .from("clinician_summary")
        .select("*")
        .ilike("email", trimmed)
        .maybeSingle();

      if (clinician) {
        const isSuspended = clinician.status === "suspended";
        const hasAdmin = Boolean(clinician.is_admin || trimmed === "e20069@eng.pdn.ac.lk");

        if (isSuspended && !hasAdmin) {
          setCachedSession(null);
          queryClient.clear();
          setIsAuthenticated(false);
          setAuthEmail(null);
          setRoles([]);
          setActiveRole(null);
          setRole(null);
          setUser(null);
          setAuthError(
            "Your clinician account has been suspended by an administrator. Access to patient records and clinical features is disabled."
          );
          return false;
        }

        const resolvedRoles: ("admin" | "clinician")[] = [];
        if (hasAdmin) resolvedRoles.push("admin");
        if (!isSuspended) resolvedRoles.push("clinician");

        if (resolvedRoles.length > 0) {
          let chosenRole: "admin" | "clinician" = activeRole as any;
          if (!chosenRole || !resolvedRoles.includes(chosenRole)) {
            if (window.location.pathname.startsWith("/admin") && hasAdmin) {
              chosenRole = "admin";
            } else if (!isSuspended) {
              chosenRole = "clinician";
            } else {
              chosenRole = "admin";
            }
          }

          setRoles(resolvedRoles);
          setActiveRole(chosenRole);
          setRole(chosenRole);
          setUser(clinician as Clinician);
          setCachedSession({
            role: chosenRole,
            activeRole: chosenRole,
            roles: resolvedRoles,
            user: clinician as Clinician,
            authEmail: trimmed,
          });
          setAuthError(null);
          return true;
        }
      }
    } catch {
      // Fallback to direct table query
    }

    // 3. Client-side fallback: Query users_profile with case-insensitive ilike
    try {
      const { data: profile } = await supabase
        .from("users_profile")
        .select("id, email, first_name, last_name, role, is_admin")
        .ilike("email", trimmed)
        .maybeSingle();

      if (profile) {
        const { data: clinRec } = await supabase
          .from("clinicians")
          .select("status")
          .eq("user_id", profile.id)
          .maybeSingle();

        const isSuspended = clinRec?.status === "suspended";
        const hasAdmin = profile.role === "admin" || Boolean(profile.is_admin) || trimmed === "e20069@eng.pdn.ac.lk";

        if (isSuspended && !hasAdmin) {
          setCachedSession(null);
          queryClient.clear();
          setIsAuthenticated(false);
          setAuthEmail(null);
          setRoles([]);
          setActiveRole(null);
          setRole(null);
          setUser(null);
          setAuthError(
            "Your clinician account has been suspended by an administrator. Access to patient records and clinical features is disabled."
          );
          return false;
        }

        const resolvedRoles: ("admin" | "clinician")[] = [];
        if (hasAdmin) resolvedRoles.push("admin");
        if (profile.role === "clinician" && !isSuspended) resolvedRoles.push("clinician");
        if (resolvedRoles.length === 0 && hasAdmin) {
          resolvedRoles.push("admin");
        }

        if (resolvedRoles.length > 0) {
          let chosenRole: "admin" | "clinician" = activeRole as any;
          if (!chosenRole || !resolvedRoles.includes(chosenRole)) {
            if (window.location.pathname.startsWith("/admin") && hasAdmin) {
              chosenRole = "admin";
            } else if (!isSuspended) {
              chosenRole = "clinician";
            } else {
              chosenRole = "admin";
            }
          }

          const fallbackUser: Clinician = {
            id: profile.id,
            first_name: profile.first_name || (chosenRole === "admin" ? "Admin" : "Clinician"),
            last_name: profile.last_name || "",
            email: profile.email,
            specialty: chosenRole === "admin" ? "Administration" : "Podiatry",
            institution: "FootSense Clinical Health",
            ahpra_number: "",
            status: isSuspended ? "suspended" : "active",
            last_login: new Date().toISOString(),
            created_at: "",
            patient_count: 0,
            is_admin: hasAdmin,
          };

          setRoles(resolvedRoles);
          setActiveRole(chosenRole);
          setRole(chosenRole);
          setUser(fallbackUser);
          setCachedSession({
            role: chosenRole,
            activeRole: chosenRole,
            roles: resolvedRoles,
            user: fallbackUser,
            authEmail: trimmed,
          });
          setAuthError(null);
          return true;
        }
      }
    } catch {}

    // 4. Hardcoded Safeguard for e20069@eng.pdn.ac.lk (User requested dual role)
    if (trimmed === "e20069@eng.pdn.ac.lk") {
      const dualRoles: ("admin" | "clinician")[] = ["clinician", "admin"];
      const chosenRole: "admin" | "clinician" = window.location.pathname.startsWith("/admin") ? "admin" : "clinician";
      const manualUser: Clinician = {
        id: "e20069-dual-role",
        first_name: "Tharaka",
        last_name: "Clinician & Admin",
        email: "e20069@eng.pdn.ac.lk",
        specialty: "Podiatry & Administration",
        institution: "FootSense Clinical Health",
        ahpra_number: "MED0001234567",
        status: "active",
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        patient_count: 0,
        is_admin: true,
      };

      setRoles(dualRoles);
      setActiveRole(chosenRole);
      setRole(chosenRole);
      setUser(manualUser);
      setCachedSession({
        role: chosenRole,
        activeRole: chosenRole,
        roles: dualRoles,
        user: manualUser,
        authEmail: trimmed,
      });
      setAuthError(null);
      return true;
    }

    // 5. Hardcoded Admin Email Fallback (foot.sense.monash@gmail.com - Admin only)
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
        is_admin: true,
      };
      setRoles(["admin"]);
      setActiveRole("admin");
      setRole("admin");
      setUser(fallbackAdmin);
      setCachedSession({
        role: "admin",
        activeRole: "admin",
        roles: ["admin"],
        user: fallbackAdmin,
        authEmail: trimmed,
      });
      setAuthError(null);
      return true;
    }

    // 6. Transient Delay Retry: If initial resolution failed right after Google OAuth,
    // wait 500ms and try once more before declaring not found.
    if (retryOnFailure) {
      await new Promise((r) => setTimeout(r, 500));
      return resolveUser(email, false);
    }

    setRoles([]);
    setActiveRole(null);
    setRole(null);
    setUser(null);
    setCachedSession(null);

    let msg = `Please use a registered email address to sign in, or apply for access.`;
    try {
      const app = await lookupApplication(trimmed);
      if (app.found && app.status === "pending") {
        msg = `Your clinician application for ${trimmed} is currently pending review. You will receive an update once approved.`;
      } else if (app.found && app.status === "declined") {
        msg = `The clinician application for ${trimmed} was declined${app.reason ? `: ${app.reason}` : ""}. Please contact your administrator.`;
      }
    } catch {}

    setAuthError(msg);

    // Clean up Supabase auth session so an unapproved session does not remain active
    try {
      await supabase.auth.signOut();
    } catch {}

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
        setRoles([]);
        setActiveRole(null);
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
    setAuthError(null);
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

    setRoles([]);
    setActiveRole(null);
    setRole(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthEmail(null);
    setAuthError(null);
  }, []);

  const updateUser = useCallback((updatedFields: Partial<Clinician>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      setCachedSession({
        role: activeRole ?? role,
        activeRole: activeRole ?? role,
        roles,
        user: updated,
        authEmail,
      });
      return updated;
    });
  }, [role, activeRole, roles, authEmail]);

  const value = useMemo<AuthState>(
    () => ({
      role: activeRole ?? role,
      user,
      loading,
      isAuthenticated,
      authEmail,
      authError,
      roles,
      isAdmin,
      isClinician,
      isMultiRole,
      isRootAdmin,
      activeRole: activeRole ?? role,
      switchRole,
      clearAuthError,
      signInWithGoogle,
      logout,
      updateUser,
    }),
    [
      role,
      activeRole,
      user,
      loading,
      isAuthenticated,
      authEmail,
      authError,
      roles,
      isAdmin,
      isClinician,
      isMultiRole,
      isRootAdmin,
      switchRole,
      clearAuthError,
      signInWithGoogle,
      logout,
      updateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
