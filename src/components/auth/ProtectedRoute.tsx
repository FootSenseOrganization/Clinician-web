import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Activity, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: NonNullable<UserRole>;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { loading, isAuthenticated, role, roles, switchRole, user, logout } = useAuth();
  const location = useLocation();

  // If user has the allowed role (e.g. dual-role clinician & admin) but activeRole is currently different,
  // automatically synchronize the active role to match the portal they are viewing.
  useEffect(() => {
    if (allowedRole && roles.includes(allowedRole) && role !== allowedRole) {
      switchRole(allowedRole);
    }
  }, [allowedRole, roles, role, switchRole]);

  // Branded Loading State while verifying session
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center hero-gradient px-4">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl brand-gradient shadow-elevated animate-pulse">
            <Activity className="size-6 text-primary-foreground animate-spin" />
          </span>
          <div className="text-center">
            <h2 className="text-base font-bold tracking-tight text-foreground">FootSense</h2>
            <p className="text-xs text-muted-foreground mt-1">Validating clinical session…</p>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in -> redirect to login, preserving destination
  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if clinician account is suspended when accessing clinician portal
  if (user?.status === "suspended" && (role === "clinician" || allowedRole === "clinician")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center hero-gradient px-4 py-12">
        <div className="surface-card w-full max-w-md p-8 text-center shadow-elevated">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mb-4">
            <ShieldAlert className="size-8" />
          </span>
          <h1 className="text-xl font-bold text-foreground">Account Suspended</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your clinician account has been suspended by a platform administrator. Access to patient records, risk alerts, and clinical monitoring tools is currently disabled.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {roles.includes("admin") ? (
              <button
                type="button"
                onClick={() => switchRole("admin")}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
              >
                Go to Admin Portal
              </button>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent/60"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signed in but user does not have permission for this portal
  if (allowedRole && !roles.includes(allowedRole)) {
    const fallbackTarget = roles.includes("admin") ? "/admin/dashboard" : "/dashboard";
    return <Navigate to={fallbackTarget} replace />;
  }

  return <>{children}</>;
}

