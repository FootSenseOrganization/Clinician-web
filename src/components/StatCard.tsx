import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "blue" | "green" | "amber" | "red" | "teal";

const accents: Record<Accent, { icon: string; ring: string }> = {
  blue: { icon: "bg-brand-soft text-primary", ring: "hover:border-primary/40" },
  green: { icon: "bg-risk-low-soft text-risk-low", ring: "hover:border-risk-low/40" },
  amber: {
    icon: "bg-risk-moderate-soft text-risk-moderate",
    ring: "hover:border-risk-moderate/40",
  },
  red: { icon: "bg-risk-high-soft text-risk-high", ring: "hover:border-risk-high/40" },
  teal: { icon: "bg-brand-soft text-secondary", ring: "hover:border-secondary/40" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
  hint,
  pulse,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: Accent;
  hint?: string;
  pulse?: boolean;
  onClick?: () => void;
}) {
  const a = accents[accent];
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "surface-card group flex w-full items-start justify-between gap-4 p-5 text-left transition-all duration-200 hover:shadow-elevated",
        a.ring,
        onClick && "cursor-pointer",
      )}
    >
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span
        className={cn(
          "relative inline-flex size-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
          a.icon,
        )}
      >
        {pulse && (
          <span className="absolute inset-0 animate-ping rounded-xl bg-risk-high/20" />
        )}
        <Icon className="relative size-5" />
      </span>
    </Comp>
  );
}
