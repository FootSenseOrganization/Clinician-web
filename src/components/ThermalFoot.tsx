import { cn } from "@/lib/utils";
import { getAsymmetryTone } from "@/services/measurementService";
import type { Measurement } from "@/types";

function toneCls(tone: "low" | "moderate" | "high") {
  return tone === "high"
    ? "text-risk-high"
    : tone === "moderate"
      ? "text-risk-moderate"
      : "text-risk-low";
}

function toneDot(tone: "low" | "moderate" | "high") {
  return tone === "high" ? "bg-risk-high" : tone === "moderate" ? "bg-risk-moderate" : "bg-risk-low";
}

export function ThermalFoot({
  side,
  measurement,
  showPoints,
}: {
  side: "left" | "right";
  measurement: Measurement;
  showPoints: boolean;
}) {
  const points = measurement.clinical_points[side];
  const other = measurement.clinical_points[side === "left" ? "right" : "left"];

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-semibold capitalize text-foreground">{side} Foot</p>
      <div className="relative h-[600px] w-[240px] overflow-hidden rounded-xl border border-border bg-slate-800/90 bg-[linear-gradient(160deg,oklch(0.279_0.041_260)_0%,oklch(0.208_0.042_265)_100%)]">
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/40">
          Thermal Image
        </span>
        {showPoints &&
          points.map((p, i) => {
            const opposite = other[i]?.temp_celsius ?? p.temp_celsius;
            const asym = Math.abs(p.temp_celsius - opposite);
            const tone = getAsymmetryTone(asym);
            return (
              <div
                key={p.zone}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(p.pixel_x / 110) * 100}%`,
                  top: `${(p.pixel_y / 280) * 100}%`,
                }}
              >
                <button
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white/70 transition-transform duration-200 hover:scale-125",
                    toneDot(tone),
                  )}
                >
                  {i + 1}
                </button>
                <div className="pointer-events-none absolute left-1/2 top-8 z-10 w-44 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-left opacity-0 shadow-elevated transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                  <p className="text-xs font-semibold text-foreground">{p.zone}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Temperature: {p.temp_celsius.toFixed(1)}°C
                  </p>
                  <p className={cn("text-xs font-semibold", toneCls(tone))}>
                    Asymmetry: {asym > 0 ? "+" : ""}
                    {asym.toFixed(1)}°C
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
