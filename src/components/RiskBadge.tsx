import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const styles: Record<RiskLevel, string> = {
  low: "bg-risk-low-soft text-risk-low ring-risk-low/25",
  moderate: "bg-risk-moderate-soft text-risk-moderate ring-risk-moderate/25",
  high: "bg-risk-high-soft text-risk-high ring-risk-high/25",
};

const labels: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export function RiskBadge({
  level,
  size = "sm",
  className,
}: {
  level: RiskLevel;
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-4 py-1.5 text-sm",
        styles[level],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {labels[level]} Risk
    </span>
  );
}

export function RiskBar({ score, level }: { score: number; level: RiskLevel }) {
  const color =
    level === "high" ? "bg-risk-high" : level === "moderate" ? "bg-risk-moderate" : "bg-risk-low";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">{score}</span>
    </div>
  );
}

export function Avatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-semibold text-primary-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}
