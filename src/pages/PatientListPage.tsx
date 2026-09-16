import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClinicianLayout } from "@/components/layout/ClinicianLayout";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, RiskBadge, RiskBar } from "@/components/RiskBadge";
import { formatDate } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import * as patientController from "@/controllers/patientController";
import type { RiskLevel } from "@/types";

const selectCls =
  "rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-ring/30";

export default function PatientListPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState<"all" | RiskLevel>("all");
  const [sort, setSort] = useState<"scan" | "name" | "score">("scan");

  useEffect(() => {
    document.title = "My Patients — FootSense";
  }, []);

  const { data: allPatients = [] } = useQuery({
    queryKey: ["patients", user?.id],
    queryFn: () => (user?.id ? patientController.getAllPatients(user.id) : []),
    enabled: !!user?.id,
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["patients", "filtered", user?.id, search, risk, sort],
    queryFn: () => (user?.id ? patientController.getPatientList(search, risk, sort, user.id) : []),
    enabled: !!user?.id,
  });

  return (
    <ClinicianLayout>
      <PageHeader title="My Patients" subtitle={`${allPatients.length} patients assigned`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <select
          className={selectCls}
          value={risk}
          onChange={(e) => setRisk(e.target.value as "all" | RiskLevel)}
        >
          <option value="all">All Risk Levels</option>
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low</option>
        </select>
        <select
          className={selectCls}
          value={sort}
          onChange={(e) => setSort(e.target.value as "scan" | "name" | "score")}
        >
          <option value="scan">Sort by: Last Scan</option>
          <option value="name">Sort by: Name</option>
          <option value="score">Sort by: Risk Score</option>
        </select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Age</th>
                <th className="px-5 py-3 font-semibold">Diabetes Type</th>
                <th className="px-5 py-3 font-semibold">Last Scan</th>
                <th className="px-5 py-3 font-semibold">Risk Score</th>
                <th className="px-5 py-3 font-semibold">Risk Level</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-border transition-colors duration-150 hover:bg-accent/60 ${
                    i % 2 === 1 ? "bg-muted/30" : ""
                  }`}
                >
                  <td className="px-5 py-3">
                    <Link
                      to={`/patients/${p.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar initials={`${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`} className="size-9" />
                      <div>
                        <p className="font-semibold text-foreground transition-colors hover:text-primary hover:underline">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{p.age ?? "—"}</td>
                  <td className="px-5 py-3">{p.diabetes_type ?? "—"}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{p.last_measurement ? formatDate(p.last_measurement) : "—"}</td>
                  <td className="px-5 py-3">
                    <RiskBar score={p.latest_risk_score} level={p.latest_risk_level} />
                  </td>
                  <td className="px-5 py-3">
                    <RiskBadge level={p.latest_risk_level} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/patients/${p.id}`}
                      className="inline-flex rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    No patients match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ClinicianLayout>
  );
}
