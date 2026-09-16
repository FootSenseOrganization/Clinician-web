import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: NonNullable<UserRole>;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { loading, isAuthenticated, role } = useAuth();
  const location = useLocation();

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

  // Signed in but accessing mismatched role portal
  if (allowedRole && role !== allowedRole) {
    const fallbackTarget = role === "admin" ? "/admin/dashboard" : "/dashboard";
    return <Navigate to={fallbackTarget} replace />;
  }

  return <>{children}</>;
}
