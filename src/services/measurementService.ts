import * as measurementModel from "@/models/measurementModel";
import { formatDate } from "@/utils/format";
import type { Measurement } from "@/types";

export function getPatientMeasurements(patientId: string): Measurement[] {
  return [...measurementModel.findByPatientId(patientId)].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function computeChartData(measurements: Measurement[]) {
  return [...measurements]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((m) => ({
      date: formatDate(m.timestamp),
      risk: m.analysis.risk_score,
      asymmetry: m.analysis.max_asymmetry_celsius,
    }));
}

export function computeAsymmetry(leftTemp: number, rightTemp: number): number {
  return Math.abs(leftTemp - rightTemp);
}

export function getAsymmetryTone(value: number): "low" | "moderate" | "high" {
  if (value > 2) return "high";
  if (value >= 1) return "moderate";
  return "low";
}
