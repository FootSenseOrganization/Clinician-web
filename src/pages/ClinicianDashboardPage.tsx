import { Link } from "react-router-dom";
import { AlertTriangle, Bell, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClinicianLayout } from "@/components/layout/ClinicianLayout";
import { Avatar, RiskBadge } from "@/components/RiskBadge";
import { StatCard } from "@/components/StatCard";
import { formatDate, timeAgo } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import * as patientController from "@/controllers/patientController";
import * as alertController from "@/controllers/alertController";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function ClinicianDashboardPage() {
  const { user } = useAuth();

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientController.getAllPatients(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => alertController.getAllAlerts(),
  });

  const { data: unread = [] } = useQuery({
    queryKey: ["alerts", "unread"],
    queryFn: () => alertController.getUnreadAlerts(),
  });

  const high = patients.filter((p) => p.latest_risk_level === "high").length;
  const moderate = patients.filter((p) => p.latest_risk_level === "moderate").length;
  const recentPatients = [...patients]
    .sort(
      (a, b) =>
        new Date(b.last_measurement ?? 0).getTime() -
        new Date(a.last_measurement ?? 0).getTime(),
    )
    .slice(0, 4);

  const lastName = user?.name?.split(" ").slice(-1)[0] ?? "";

  useEffect(() => {
    document.title = "Clinician Dashboard — FootSense";
  }, []);

  return (
    <ClinicianLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, Dr. {lastName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Patients" value={patients.length} icon={TrendingUp} accent="blue" hint="Assigned to you" />
        <StatCard label="High Risk" value={high} icon={AlertTriangle} accent="red" />
        <StatCard label="Moderate Risk" value={moderate} icon={Users} accent="amber" />
        <StatCard label="Unread Alerts" value={unread.length} icon={Bell} accent="red" pulse />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Alerts</h2>
            <Link to="/alerts" className="text-sm font-medium text-primary hover:underline">
              View All Alerts →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {unread.slice(0, 2).map((a) => (
              <Link
                key={a.id}
                to={`/patients/${a.patient_id}`}
                className="block rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{a.patient_name}</p>
                  <RiskBadge level={a.risk_level} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{timeAgo(a.timestamp)}</p>
              </Link>
            ))}
            {unread.length === 0 && (
              <p className="text-sm text-muted-foreground">No unread alerts. Nice work.</p>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {alerts.length} alerts in total across your patients.
          </p>
        </section>

        <section className="surface-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Patients</h2>
            <Link to="/patients" className="text-sm font-medium text-primary hover:underline">
              View All Patients →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {recentPatients.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/patients/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors duration-200 hover:border-border hover:bg-muted"
                >
                  <Avatar initials={p.avatar_initials ?? ""} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last scan {p.last_measurement ? formatDate(p.last_measurement) : "—"}
                    </p>
                  </div>
                  <RiskBadge level={p.latest_risk_level} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ClinicianLayout>
  );
}
