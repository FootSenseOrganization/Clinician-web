import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Inbox,
  LayoutDashboard,
  LogOut,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import * as alertController from "@/controllers/alertController";
import * as assignmentController from "@/controllers/assignmentController";
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
  const { role, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const { data: unread = 0 } = useQuery({
    queryKey: ["alerts", "unreadCount"],
    queryFn: () => alertController.getUnreadCount(),
    refetchInterval: 30_000,
  });

  const { data: pendingAssignments = [] } = useQuery({
    queryKey: ["assignments", "pending"],
    queryFn: () => assignmentController.getPendingAssignments(),
  });

  useEffect(() => {
    if (!loading && role !== "clinician") navigate("/login");
  }, [loading, role, navigate]);

  if (loading || role !== "clinician" || !user) {
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
            {user.avatar_initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {user.specialty}
            </p>
          </div>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />
          <NavItem to="/patients" icon={Users} label="Patients" />
          <NavItem to="/alerts" icon={Bell} label="Alerts" badge={unread} badgeTone="danger" />
          <NavItem to="/assignments" icon={Inbox} label="Assignment Requests" badge={pendingAssignments.length} />
          <NavItem to="/profile" icon={User} label="Profile" />
        </nav>

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
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
          <nav className="flex items-center gap-1 overflow-x-auto text-xs">
            <Link to="/dashboard" className="rounded-md px-2 py-1 text-sidebar-foreground/80">
              Home
            </Link>
            <Link to="/patients" className="rounded-md px-2 py-1 text-sidebar-foreground/80">
              Patients
            </Link>
            <Link to="/alerts" className="rounded-md px-2 py-1 text-sidebar-foreground/80">
              Alerts
            </Link>
            <Link to="/assignments" className="rounded-md px-2 py-1 text-sidebar-foreground/80">
              Requests
            </Link>
            <Link to="/profile" className="rounded-md px-2 py-1 text-sidebar-foreground/80">
              Profile
            </Link>
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
