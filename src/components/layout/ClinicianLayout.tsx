import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRightLeft,
  Bell,
  Inbox,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import * as alertController from "@/controllers/alertController";
import * as assignmentController from "@/controllers/assignmentController";
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
  badgeTone = "brand",
  end = false,
}: {
  to: string;
  icon: typeof Users;
  label: string;
  badge?: number;
  badgeTone?: "brand" | "danger";
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(baseCls, isActive && activeCls)}
    >
      <Icon className="size-4.5" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground",
            badgeTone === "danger" ? "bg-risk-high" : "bg-primary",
          )}
        >
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

export function ClinicianLayout({ children }: { children: ReactNode }) {
  const { role, user, loading, logout, isAdmin, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const { data: unread = 0 } = useQuery({
    queryKey: ["alerts", "unreadCount", user?.id],
    queryFn: () => alertController.getUnreadCount(),
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });

  const { data: pendingAssignments = [] } = useQuery({
    queryKey: ["assignments", "pending", user?.id],
    queryFn: () => assignmentController.getPendingAssignments(),
    enabled: !!user?.id,
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sidebar-gradient sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border p-4 md:flex">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1">
          <span className="inline-flex size-9 items-center justify-center rounded-xl brand-gradient">
            <Activity className="size-5 text-primary-foreground" />
          </span>
          <span className="text-lg font-bold tracking-tight text-sidebar-accent-foreground">
            FootSense
          </span>
        </Link>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full brand-gradient text-sm font-semibold text-primary-foreground">
            {user.first_name?.[0] ?? ""}{user.last_name?.[0] ?? ""}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {user.specialty}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              switchRole("admin");
              navigate("/admin/dashboard");
            }}
            className="mt-3 flex w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:shadow-card"
            title="Switch to Admin Portal"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Switch to Admin Portal
            </span>
            <ArrowRightLeft className="size-3.5 opacity-75" />
          </button>
        )}

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />
          <NavItem to="/patients" icon={Users} label="Patients" />
          <NavItem to="/alerts" icon={Bell} label="Alerts" badge={unread} badgeTone="danger" />
          <NavItem to="/assignments" icon={Inbox} label="Assignment Requests" badge={pendingAssignments.length} />
          <NavItem to="/profile" icon={User} label="Profile" />
        </nav>

        <button
          onClick={() => setShowSignOutDialog(true)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors duration-200 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4.5" />
          Sign Out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sidebar-gradient flex items-center justify-between gap-3 px-4 py-3 md:hidden">
          <Link to="/dashboard" className="text-base font-bold text-sidebar-accent-foreground">
            FootSense
          </Link>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                onClick={() => {
                  switchRole("admin");
                  navigate("/admin/dashboard");
                }}
                className="mr-1 inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/25"
                title="Switch to Admin Portal"
              >
                <ShieldCheck className="size-3.5" />
                Admin
              </button>
            )}
            <nav className="flex items-center gap-1 overflow-x-auto text-xs">
              <Link to="/dashboard" className="rounded-md px-2 py-1 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
                Home
              </Link>
              <Link to="/patients" className="rounded-md px-2 py-1 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
                Patients
              </Link>
              <Link to="/alerts" className="rounded-md px-2 py-1 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
                Alerts
              </Link>
              <Link to="/assignments" className="rounded-md px-2 py-1 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
                Requests
              </Link>
              <Link to="/profile" className="rounded-md px-2 py-1 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
                Profile
              </Link>
            </nav>
            <button
              onClick={() => setShowSignOutDialog(true)}
              aria-label="Sign Out"
              title="Sign Out"
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
        title="Are you sure you want to sign out?"
        description="You will be signed out of your clinician account. Telemetry data and pending assignments will remain securely saved."
      />
    </div>
  );
}
