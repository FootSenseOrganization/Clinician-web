import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/StatCard";
import { formatDate } from "@/utils/format";
import * as adminController from "@/controllers/adminController";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminController.getAdminDashboardData(),
  });

  const stats = data?.stats ?? { pendingApplications: 0, activeClinicians: 0, suspendedClinicians: 0, totalPatients: 0 };
  const recentApplications = data?.recentApplications ?? [];

  useEffect(() => {
    document.title = "Admin Dashboard — FootSense";
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-soft text-primary">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, Administrator</h1>
          <p className="text-sm text-muted-foreground">
            Platform health and pending verifications
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending Applications"
          value={stats.pendingApplications}
          icon={ClipboardList}
          accent="amber"
          onClick={() => navigate("/admin/applications")}
        />
        <StatCard label="Active Clinicians" value={stats.activeClinicians} icon={UserCheck} accent="green" />
        <StatCard
          label="Suspended Clinicians"
          value={stats.suspendedClinicians}
          icon={UserX}
          accent="red"
        />
        <StatCard label="Total Patients" value={stats.totalPatients} icon={Users} accent="blue" />
      </div>

      <section className="surface-card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Recent Applications</h2>
          <Link
            to="/admin/applications"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">AHPRA Number</th>
                <th className="px-6 py-3 font-semibold">Specialty</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((a, i) => (
                <tr
                  key={a.id}
                  className={`border-b border-border transition-colors duration-150 hover:bg-accent/60 ${
                    i % 2 === 1 ? "bg-muted/30" : ""
                  }`}
                >
                  <td className="px-6 py-3 font-semibold">{a.first_name} {a.last_name}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-md bg-brand-soft px-2 py-1 font-mono text-xs font-semibold text-accent-foreground">
                      {a.ahpra_number}
                    </span>
                  </td>
                  <td className="px-6 py-3">{a.specialty}</td>
                  <td className="px-6 py-3 whitespace-nowrap">{formatDate(a.submitted_at)}</td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      to="/admin/applications"
                      className="inline-flex rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 hover:border-primary hover:text-primary"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}
