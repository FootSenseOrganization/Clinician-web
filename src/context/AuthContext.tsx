import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { mockClinician } from "@/mock/mockData";
import type { Clinician, UserRole } from "@/types";

interface AuthState {
  role: UserRole;
  user: Clinician | null;
  loading: boolean;
  loginAsClinician: () => void;
  loginAsAdmin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = "footsense.role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "admin" || stored === "clinician") setRole(stored);
    setLoading(false);
  }, []);

  const apply = useCallback((next: UserRole) => {
    setRole(next);
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      role,
      user: role === "clinician" ? mockClinician : null,
      loading,
      loginAsClinician: () => apply("clinician"),
      loginAsAdmin: () => apply("admin"),
      logout: () => apply(null),
    }),
    [role, loading, apply],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
