import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRightLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import * as adminController from "@/controllers/adminController";
import { SignOutConfirmDialog } from "@/components/auth/SignOutConfirmDialog";
import { cn } from "@/lib/utils";

const baseCls =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors duration-200 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground";
const activeCls =
  "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]";

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
}: {
  to: string;
  icon: typeof Users;
  label: string;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => cn(baseCls, isActive && activeCls)}
    >
      <Icon className="size-4.5" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-risk-moderate px-1.5 py-0.5 text-[11px] font-bold text-foreground">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { role, loading, logout, isClinician, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const { data } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminController.getAdminDashboardData(),
    enabled: role === "admin",
  });
  const stats = data?.stats ?? { pendingApplications: 0, activeClinicians: 0, suspendedClinicians: 0, totalPatients: 0 };

  if (loading || role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sidebar-gradient sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border p-4 md:flex">
        <Link to="/admin/dashboard" className="flex items-center gap-2 px-2 py-1">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-sidebar-accent">
            <ShieldCheck className="size-5 text-primary" />
          </span>
          <span className="text-base font-bold tracking-tight text-sidebar-accent-foreground">
            FootSense Admin
          </span>
        </Link>

        {isClinician && (
          <button
            onClick={() => {
              switchRole("clinician");
              navigate("/dashboard");
            }}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:shadow-card"
            title="Switch to Clinician Portal"
          >
            <span className="flex items-center gap-2">
              <Activity className="size-4" />
              Switch to Clinician
            </span>
            <ArrowRightLeft className="size-3.5 opacity-75" />
          </button>
        )}

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem
            to="/admin/applications"
            icon={ClipboardList}
            label="Applications"
            badge={stats.pendingApplications}
          />
          <NavItem to="/admin/clinicians" icon={Users} label="Clinicians" />
        </nav>

        <button
          onClick={() => setShowSignOutDialog(true)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors duration-200 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4.5" />
          Logout
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sidebar-gradient flex items-center justify-between gap-3 px-4 py-3 md:hidden">
          <span className="text-base font-bold text-sidebar-accent-foreground">
            FootSense Admin
          </span>
          <div className="flex items-center gap-1">
            {isClinician && (
              <button
                onClick={() => {
                  switchRole("clinician");
                  navigate("/dashboard");
                }}
                className="mr-1 inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/25"
                title="Switch to Clinician Portal"
              >
                <Activity className="size-3.5" />
                Clinician
              </button>
            )}
            <nav className="flex items-center gap-1 text-xs">
              <Link to="/admin/dashboard" className="rounded-md px-2 py-1 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
                Home
              </Link>
              <Link to="/admin/applications" className="rounded-md px-2 py-1 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
                Applications
              </Link>
              <Link to="/admin/clinicians" className="rounded-md px-2 py-1 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
                Clinicians
              </Link>
            </nav>
            <button
              onClick={() => setShowSignOutDialog(true)}
              aria-label="Logout"
              title="Logout"
              className="inline-flex items-center justify-center rounded-md p-1.5 text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <SignOutConfirmDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleSignOut}
        title="Are you sure you want to log out?"
        description="You will be logged out of the admin console. You will need to sign in again to review applications or manage clinician accounts."
        confirmText="Log Out"
      />
    </div>
  );
}
