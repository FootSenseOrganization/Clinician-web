import { useState, useEffect } from "react";
import { ExternalLink, ImageOff } from "lucide-react";
import type { Measurement } from "@/types";

/**
 * Renders the single thermal heatmap image containing BOTH feet.
 * The images in Supabase Storage (footsense-heatmaps) are composite dual-foot scans.
 * For 'detected_9pts', the 9 clinical points are already drawn directly into the heatmap PNG.
 * Per clinical requirements, manual point annotations are NOT overlaid onto the image.
 */
export function ThermalView({
  measurement,
  imageType = "detected_9pts",
}: {
  measurement: Measurement;
  showPoints?: boolean;
  imageType?: "detected_9pts" | "room_calibrated" | "raw";
}) {
  const [imageError, setImageError] = useState(false);

  // Pick target image with fallback chain
  const imageUrl =
    imageType === "room_calibrated"
      ? (measurement.images.room_calibrated_url || measurement.images.detected_9pts_url || measurement.images.raw_url)
      : imageType === "raw"
        ? (measurement.images.raw_url || measurement.images.room_calibrated_url || measurement.images.detected_9pts_url)
        : (measurement.images.detected_9pts_url || measurement.images.room_calibrated_url || measurement.images.raw_url);

  // Automatically reset error whenever the active image URL changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative overflow-hidden rounded-xl border border-border bg-slate-950/90 shadow-card flex items-center justify-center min-h-[340px] w-full max-w-[720px] p-2">
        {imageUrl && !imageError ? (
          <img
            key={imageUrl}
            src={imageUrl}
            alt={`FootSense Thermal Scan (${imageType})`}
            className="block h-auto max-h-[580px] w-full rounded-lg object-contain"
            referrerPolicy="no-referrer"
            loading="eager"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
            <ImageOff className="size-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {imageError ? "Thermal image could not be loaded directly" : "No thermal image linked"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {imageError
                  ? "The browser was unable to load the asset in the current frame."
                  : "No image link was found in the measurement record."}
              </p>
            </div>
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-4 hover:text-primary/80"
              >
                <span>Open Direct Storage URL</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer view info */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-[720px] px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground/80">
            {imageType === "detected_9pts"
              ? "9-Point Detection (Dual-Foot Scan)"
              : imageType === "room_calibrated"
                ? "Room Calibrated (Dual-Foot Scan)"
                : "Raw Thermal (Dual-Foot Scan)"}
          </span>
          {imageType === "detected_9pts" && (
            <span className="text-[11px] text-muted-foreground">
              (ML detected points 1–9 already rendered in image)
            </span>
          )}
        </div>

        {imageUrl && !imageError && (
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Open in new tab</span>
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// Keep backward compat export
export { ThermalView as ThermalFoot };
