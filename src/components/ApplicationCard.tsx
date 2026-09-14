import { Building2, Check, Mail, Stethoscope, X } from "lucide-react";
import { formatDate } from "@/utils/format";
import type { Application } from "@/types";

export function ApplicationCard({
  app,
  onApprove,
  onDecline,
}: {
  app: Application;
  onApprove?: () => void;
  onDecline?: () => void;
}) {
  return (
    <article className="surface-card p-6 transition-all duration-200 hover:shadow-elevated">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{app.full_name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted: {formatDate(app.submitted_at)}
          </p>
        </div>
        <div className="rounded-xl border border-primary/25 bg-brand-soft px-4 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            AHPRA Number
          </p>
          <p className="font-mono text-lg font-bold tracking-wider text-primary">
            {app.ahpra_number}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <Mail className="size-4 shrink-0" /> {app.email}
        </span>
        <span className="inline-flex items-center gap-2">
          <Stethoscope className="size-4 shrink-0" /> {app.specialty}
        </span>
        <span className="inline-flex items-center gap-2">
          <Building2 className="size-4 shrink-0" /> {app.institution}
        </span>
      </div>

      {app.status === "declined" && app.decline_reason && (
        <p className="mt-4 rounded-lg bg-risk-high-soft px-3 py-2 text-xs text-risk-high">
          Reason: {app.decline_reason}
        </p>
      )}

      {app.status === "pending" && (
        <div className="mt-6 flex gap-2">
          <button
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 rounded-lg bg-risk-low px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Check className="size-4" /> Approve
          </button>
          <button
            onClick={onDecline}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors duration-200 hover:bg-risk-high-soft"
          >
            <X className="size-4" /> Decline
          </button>
        </div>
      )}
    </article>
  );
}
