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

/**
 * Renders the combined thermal heatmap image (both feet) with clinical point overlays.
 * The GCS image is a composite — both feet in one image.
 */
export function ThermalView({
  measurement,
  showPoints,
  imageType = "detected_9pts",
}: {
  measurement: Measurement;
  showPoints: boolean;
  imageType?: "detected_9pts" | "room_calibrated" | "raw";
}) {
  const imageUrl =
    imageType === "room_calibrated"
      ? measurement.images.room_calibrated_url
      : imageType === "raw"
        ? measurement.images.raw_url
        : measurement.images.detected_9pts_url;

  const pointsLeft = measurement.clinical_points.left;
  const pointsRight = measurement.clinical_points.right;

  // The image native size from the GCS heatmaps is typically ~320x420
  // pixel_x/pixel_y are absolute coordinates on the original image
  const IMAGE_WIDTH = 320;
  const IMAGE_HEIGHT = 420;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative overflow-hidden rounded-xl border border-border bg-slate-800/90 shadow-card">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Thermal heatmap of both feet"
            className="block h-auto w-full max-w-[480px]"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-[420px] w-[320px] items-center justify-center">
            <span className="text-xs font-medium text-white/40">No thermal image available</span>
          </div>
        )}

        {showPoints && imageUrl && (
          <>
            {/* Left foot points */}
            {pointsLeft.map((p, i) => {
              const opposite = pointsRight[i]?.temp_celsius ?? p.temp_celsius;
              const asym = Math.abs(p.temp_celsius - opposite);
              const tone = getAsymmetryTone(asym);
              return (
                <div
                  key={`L-${p.zone}`}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(p.pixel_x / IMAGE_WIDTH) * 100}%`,
                    top: `${(p.pixel_y / IMAGE_HEIGHT) * 100}%`,
                  }}
                >
                  <button
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white/70 transition-transform duration-200 hover:scale-125",
                      toneDot(tone),
                    )}
                  >
                    {i + 1}
                  </button>
                  <div className="pointer-events-none absolute left-1/2 top-7 z-10 w-44 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-left opacity-0 shadow-elevated transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                    <p className="text-[10px] font-semibold text-primary">Left Foot</p>
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

            {/* Right foot points */}
            {pointsRight.map((p, i) => {
              const opposite = pointsLeft[i]?.temp_celsius ?? p.temp_celsius;
              const asym = Math.abs(p.temp_celsius - opposite);
              const tone = getAsymmetryTone(asym);
              return (
                <div
                  key={`R-${p.zone}`}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(p.pixel_x / IMAGE_WIDTH) * 100}%`,
                    top: `${(p.pixel_y / IMAGE_HEIGHT) * 100}%`,
                  }}
                >
                  <button
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white/60 transition-transform duration-200 hover:scale-125",
                      toneDot(tone),
                    )}
                  >
                    {i + 1}
                  </button>
                  <div className="pointer-events-none absolute left-1/2 top-7 z-10 w-44 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-left opacity-0 shadow-elevated transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                    <p className="text-[10px] font-semibold text-chart-2">Right Foot</p>
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
          </>
        )}
      </div>

      {/* Image type selector */}
      <div className="flex gap-1 text-xs">
        <span className="rounded-full bg-muted px-2.5 py-1 font-medium">
          {imageType === "detected_9pts"
            ? "9-Point Detection"
            : imageType === "room_calibrated"
              ? "Room Calibrated"
              : "Raw Thermal"}
        </span>
      </div>
    </div>
  );
}

// Keep backward compat export
export { ThermalView as ThermalFoot };
