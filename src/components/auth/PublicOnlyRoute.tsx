import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

/**
 * For public auth portals like /login and /admin.
 * If the user is already authenticated, redirects them cleanly to their respective dashboard
 * using history replacement so the browser back button doesn't create redirect loops.
 */
export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) {
    return <>{children}</>;
  }

  if (isAuthenticated && role === "clinician") {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAuthenticated && role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
