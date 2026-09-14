import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ClinicianLayout } from "@/components/layout/ClinicianLayout";
import { PageHeader } from "@/components/PageHeader";
import { RiskBadge } from "@/components/RiskBadge";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/utils/format";
import * as alertController from "@/controllers/alertController";
import type { Alert } from "@/types";

type Filter = "all" | "unread" | "high" | "moderate";

export default function AlertsCentrePage() {
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    alertController.getAllAlerts().map((a) => ({ ...a })),
  );
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    document.title = "Alerts Centre — FootSense";
  }, []);

  const unreadCount = alerts.filter((a) => !a.acknowledged).length;

  const visible = useMemo(() => {
    if (filter === "unread") return alerts.filter((a) => !a.acknowledged);
    if (filter === "high") return alerts.filter((a) => a.risk_level === "high");
    if (filter === "moderate") return alerts.filter((a) => a.risk_level === "moderate");
    return alerts;
  }, [alerts, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "high", label: "High Risk" },
    { key: "moderate", label: "Moderate Risk" },
  ];

  return (
    <ClinicianLayout>
      <PageHeader
        title="Alerts Centre"
        subtitle="Clinical alerts derived from patient measurements"
        actions={
          <button
            onClick={() => setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })))}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-muted"
          >
            Acknowledge All
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
              filter === f.key
                ? "brand-gradient text-primary-foreground shadow-card"
                : "border border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((a) => (
          <article
            key={a.id}
            className={cn(
              "surface-card flex gap-4 p-5 transition-all duration-200",
              a.acknowledged ? "opacity-60" : "shadow-card",
            )}
          >
            <span
              className={cn(
                "w-1 shrink-0 rounded-full",
                a.risk_level === "high" ? "bg-risk-high" : "bg-risk-moderate",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/patients/${a.patient_id}`}
                  className="text-base font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {a.patient_name}
                </Link>
                <RiskBadge level={a.risk_level} />
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                  Score {a.risk_score}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">Zone:</strong> {a.zone}
                </span>
                <span>
                  <strong className="text-foreground">Asymmetry:</strong> {a.asymmetry_value}°C
                </span>
                <span>{timeAgo(a.timestamp)}</span>
              </div>
            </div>
            <div className="self-center">
              {a.acknowledged ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                  <Check className="size-4" /> Acknowledged
                </span>
              ) : (
                <button
                  onClick={() =>
                    setAlerts((prev) =>
                      prev.map((x) => (x.id === a.id ? { ...x, acknowledged: true } : x)),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-risk-low px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Acknowledge <Check className="size-4" />
                </button>
              )}
            </div>
          </article>
        ))}
        {visible.length === 0 && (
          <p className="surface-card p-10 text-center text-sm text-muted-foreground">
            No alerts in this view.
          </p>
        )}
      </div>
    </ClinicianLayout>
  );
}
