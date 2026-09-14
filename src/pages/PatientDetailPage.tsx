import { Link, useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ClinicianLayout } from "@/components/layout/ClinicianLayout";
import { Avatar, RiskBadge } from "@/components/RiskBadge";
import { ThermalFoot } from "@/components/ThermalFoot";
import { RadialScore } from "@/components/RadialScore";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/utils/format";
import { getAsymmetryTone } from "@/services/measurementService";
import * as patientController from "@/controllers/patientController";
import { mockClinician } from "@/mock/mockData";
import type { Instruction, Remark } from "@/types";

type TabKey = "thermal" | "history" | "notes";

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

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const patient = patientController.getPatientDetail(id!);
  const measurements = patientController.getPatientMeasurements(id!);
  const [tab, setTab] = useState<TabKey>("thermal");
  const [selectedId, setSelectedId] = useState(measurements[0]?.id ?? "");
  const [showPoints, setShowPoints] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [remarks, setRemarks] = useState<Remark[]>(() =>
    patientController.getPatientRemarks(id!).map((r) => ({ ...r })),
  );
  const [instructions, setInstructions] = useState<Instruction[]>(() =>
    patientController.getPatientInstructions(id!).map((i) => ({ ...i })),
  );
  const [draftRemark, setDraftRemark] = useState<string | null>(null);
  const [draftInstruction, setDraftInstruction] = useState<string | null>(null);
  const [editingRemark, setEditingRemark] = useState<string | null>(null);
  const [editingInstruction, setEditingInstruction] = useState<string | null>(null);

  const selected = measurements.find((m) => m.id === selectedId) ?? measurements[0];

  const chartData = useMemo(
    () =>
      [...measurements]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((m) => ({
          date: formatDate(m.timestamp),
          risk: m.analysis.risk_score,
          asymmetry: m.analysis.max_asymmetry_celsius,
        })),
    [measurements],
  );

  useEffect(() => {
    document.title = patient
      ? `${patient.name} — Patient Thermal Analysis — FootSense`
      : "Patient Not Found — FootSense";
  }, [patient]);

  if (!patient || !selected) {
    return (
      <ClinicianLayout>
        <p className="surface-card p-10 text-center text-sm text-muted-foreground">
          Patient not found.{" "}
          <Link to="/patients" className="font-semibold text-primary hover:underline">
            Back to patients
          </Link>
        </p>
      </ClinicianLayout>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "thermal", label: "Thermal Analysis" },
    { key: "history", label: "Measurement History" },
    { key: "notes", label: "Remarks & Instructions" },
  ];

  return (
    <ClinicianLayout>
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>›</span>
        <Link to="/patients" className="hover:text-foreground">
          Patients
        </Link>
        <span>›</span>
        <span className="font-medium text-foreground">{patient.name}</span>
      </nav>

      <section className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar initials={patient.avatar_initials} className="size-16 text-lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
              <p className="text-sm text-muted-foreground">{patient.email}</p>
              <p className="text-sm text-muted-foreground">{patient.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <RiskBadge level={patient.latest_risk_level} size="lg" />
              <p className="mt-2 text-xs text-muted-foreground">
                Last scan {formatDateTime(patient.last_measurement)}
              </p>
            </div>
            <RadialScore score={patient.latest_risk_score} level={patient.latest_risk_level} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {[
            `Age: ${patient.age}`,
            `Diabetes: ${patient.diabetes_type}`,
            `Diagnosed: ${patient.diagnosis_year}`,
            `Total Scans: ${patient.total_measurements}`,
          ].map((pill) => (
            <span key={pill} className="rounded-full bg-muted px-3 py-1.5 font-medium">
              {pill}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-6 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-200",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "thermal" && (
        <div className="mt-6 space-y-6">
          <section className="surface-card p-5">
            <p className="text-sm font-semibold">Measurement</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {measurements.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                    m.id === selected.id
                      ? "brand-gradient text-primary-foreground shadow-card"
                      : "border border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {formatDateTime(m.timestamp)}
                </button>
              ))}
            </div>
          </section>

          <section className="surface-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Thermal Imaging & Clinical Points</h2>
                <p className="text-sm text-muted-foreground">
                  Hotspot: {selected.analysis.hotspot_detected ? "detected" : "none"} · Max
                  asymmetry {selected.analysis.max_asymmetry_celsius}°C at{" "}
                  {selected.analysis.asymmetry_zone}
                </p>
              </div>
              <button
                onClick={() => setShowPoints((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                  showPoints
                    ? "brand-gradient text-primary-foreground"
                    : "border border-border text-foreground hover:bg-muted",
                )}
              >
                {showPoints ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                Show Clinical Points
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-8">
              <ThermalFoot side="left" measurement={selected} showPoints={showPoints} />
              <ThermalFoot side="right" measurement={selected} showPoints={showPoints} />
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Zone</th>
                    <th className="px-4 py-3 font-semibold">Left Foot (°C)</th>
                    <th className="px-4 py-3 font-semibold">Right Foot (°C)</th>
                    <th className="px-4 py-3 font-semibold">Asymmetry (°C)</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.sensor_readings.left_foot.map((l, i) => {
                    const r = selected.sensor_readings.right_foot[i];
                    const asym = Math.abs(l.temp_celsius - (r?.temp_celsius ?? l.temp_celsius));
                    const tone = getAsymmetryTone(asym);
                    return (
                      <tr
                        key={l.zone}
                        className={cn(
                          "border-b border-border transition-colors duration-150 hover:bg-accent/60",
                          i % 2 === 1 && "bg-muted/30",
                        )}
                      >
                        <td className="px-4 py-2.5 font-medium">{l.zone_name}</td>
                        <td className="px-4 py-2.5 tabular-nums">{l.temp_celsius.toFixed(1)}</td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {(r?.temp_celsius ?? 0).toFixed(1)}
                        </td>
                        <td className={cn("px-4 py-2.5 font-semibold tabular-nums", toneCls(tone))}>
                          <span className="inline-flex items-center gap-2">
                            <span className={cn("size-2 rounded-full", toneDot(tone))} />
                            {asym.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="text-base font-semibold">Risk Score Trend</h2>
            <p className="text-sm text-muted-foreground">
              Risk score and maximum temperature asymmetry over time
            </p>
            <div className="mt-6 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis
                    yAxisId="risk"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    yAxisId="asym"
                    orientation="right"
                    domain={[0, 5]}
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                  />
                  <RTooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine
                    yAxisId="risk"
                    y={30}
                    stroke="var(--risk-low)"
                    strokeDasharray="6 4"
                    label={{ value: "Low", fontSize: 11, fill: "var(--risk-low)", position: "left" }}
                  />
                  <ReferenceLine
                    yAxisId="risk"
                    y={60}
                    stroke="var(--risk-moderate)"
                    strokeDasharray="6 4"
                    label={{
                      value: "Moderate",
                      fontSize: 11,
                      fill: "var(--risk-moderate)",
                      position: "left",
                    }}
                  />
                  <Area
                    yAxisId="risk"
                    type="monotone"
                    dataKey="risk"
                    name="Risk Score"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    fill="url(#riskFill)"
                  />
                  <Line
                    yAxisId="asym"
                    type="monotone"
                    dataKey="asymmetry"
                    name="Max Asymmetry (°C)"
                    stroke="var(--chart-2)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {tab === "history" && (
        <section className="surface-card mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Risk Score</th>
                  <th className="px-5 py-3 font-semibold">Max Asymmetry</th>
                  <th className="px-5 py-3 font-semibold">Hotspot Zones</th>
                  <th className="px-5 py-3 font-semibold">Risk Level</th>
                  <th className="px-5 py-3 text-right font-semibold">Expand</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((m) => (
                  <Fragment key={m.id}>
                    <tr className="border-b border-border transition-colors duration-150 hover:bg-accent/60">
                      <td className="px-5 py-3 whitespace-nowrap">{formatDateTime(m.timestamp)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", toneDot(m.analysis.risk_level))}
                              style={{ width: `${m.analysis.risk_score}%` }}
                            />
                          </div>
                          <span className="font-semibold tabular-nums">{m.analysis.risk_score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 tabular-nums">{m.analysis.max_asymmetry_celsius}°C</td>
                      <td className="px-5 py-3">
                        {m.analysis.hotspot_zones.length > 0
                          ? m.analysis.hotspot_zones.join(", ")
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <RiskBadge level={m.analysis.risk_level} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-border transition-colors duration-200 hover:border-primary hover:text-primary"
                          aria-label="Expand measurement"
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform duration-200",
                              expanded === m.id && "rotate-180",
                            )}
                          />
                        </button>
                      </td>
                    </tr>
                    {expanded === m.id && (
                      <tr className="border-b border-border bg-muted/40">
                        <td colSpan={6} className="px-5 py-5">
                          <div className="grid gap-6 md:grid-cols-2">
                            {(["left_foot", "right_foot"] as const).map((sideKey) => (
                              <div key={sideKey} className="rounded-xl border border-border bg-card p-4">
                                <p className="mb-3 text-sm font-semibold capitalize">
                                  {sideKey === "left_foot" ? "Left Foot" : "Right Foot"}
                                </p>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs uppercase text-muted-foreground">
                                      <th className="pb-2 font-semibold">Zone Name</th>
                                      <th className="pb-2 font-semibold">Temperature (°C)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {m.sensor_readings[sideKey].map((z) => (
                                      <tr key={z.zone} className="border-t border-border">
                                        <td className="py-1.5">{z.zone_name}</td>
                                        <td className="py-1.5 tabular-nums">
                                          {z.temp_celsius.toFixed(1)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "notes" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="surface-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Clinical Notes</h2>
              <button
                onClick={() => setDraftRemark("")}
                className="inline-flex items-center gap-1.5 rounded-lg brand-gradient px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="size-4" /> Add Remark
              </button>
            </div>

            {draftRemark !== null && (
              <div className="mt-4 rounded-xl border border-border p-3">
                <textarea
                  autoFocus
                  rows={3}
                  value={draftRemark}
                  onChange={(e) => setDraftRemark(e.target.value)}
                  placeholder="Write a clinical remark…"
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (!draftRemark.trim()) return;
                      setRemarks((prev) => [
                        {
                          id: `rem-${Date.now()}`,
                          patient_id: patient.id,
                          clinician_id: mockClinician.id,
                          clinician_name: mockClinician.name,
                          content: draftRemark.trim(),
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        },
                        ...prev,
                      ]);
                      setDraftRemark(null);
                      toast.success("Remark added.");
                    }}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setDraftRemark(null)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <ul className="mt-4 space-y-3">
              {[...remarks]
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                )
                .map((r) => (
                  <li key={r.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{r.clinician_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(r.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingRemark(editingRemark === r.id ? null : r.id)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Edit remark"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setRemarks((prev) => prev.filter((x) => x.id !== r.id));
                            toast("Remark deleted.");
                          }}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-risk-high-soft hover:text-risk-high"
                          aria-label="Delete remark"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    {editingRemark === r.id ? (
                      <div className="mt-3">
                        <textarea
                          rows={3}
                          defaultValue={r.content}
                          onBlur={(e) =>
                            setRemarks((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? {
                                      ...x,
                                      content: e.target.value,
                                      updated_at: new Date().toISOString(),
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                        />
                        <button
                          onClick={() => {
                            setEditingRemark(null);
                            toast.success("Remark updated.");
                          }}
                          className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {r.content}
                      </p>
                    )}
                  </li>
                ))}
            </ul>
          </section>

          <section className="surface-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Instructions for Patient</h2>
                <p className="text-xs text-muted-foreground">
                  These are visible to the patient on their mobile app.
                </p>
              </div>
              <button
                onClick={() => setDraftInstruction("")}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg brand-gradient px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="size-4" /> Add Instruction
              </button>
            </div>

            {draftInstruction !== null && (
              <div className="mt-4 rounded-xl border border-border p-3">
                <textarea
                  autoFocus
                  rows={3}
                  value={draftInstruction}
                  onChange={(e) => setDraftInstruction(e.target.value)}
                  placeholder="Write an instruction for the patient…"
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (!draftInstruction.trim()) return;
                      setInstructions((prev) => [
                        {
                          id: `ins-${Date.now()}`,
                          patient_id: patient.id,
                          clinician_id: mockClinician.id,
                          clinician_name: mockClinician.name,
                          content: draftInstruction.trim(),
                          visible_to_patient: true,
                          created_at: new Date().toISOString(),
                        },
                        ...prev,
                      ]);
                      setDraftInstruction(null);
                      toast.success("Instruction sent to patient.");
                    }}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setDraftInstruction(null)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <ul className="mt-4 space-y-3">
              {[...instructions]
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                )
                .map((ins) => (
                  <li key={ins.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{ins.clinician_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(ins.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setEditingInstruction(editingInstruction === ins.id ? null : ins.id)
                          }
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Edit instruction"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setInstructions((prev) => prev.filter((x) => x.id !== ins.id));
                            toast("Instruction deleted.");
                          }}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-risk-high-soft hover:text-risk-high"
                          aria-label="Delete instruction"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    {editingInstruction === ins.id ? (
                      <div className="mt-3">
                        <textarea
                          rows={3}
                          defaultValue={ins.content}
                          onBlur={(e) =>
                            setInstructions((prev) =>
                              prev.map((x) =>
                                x.id === ins.id ? { ...x, content: e.target.value } : x,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                        />
                        <button
                          onClick={() => {
                            setEditingInstruction(null);
                            toast.success("Instruction updated.");
                          }}
                          className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {ins.content}
                        </p>
                        {ins.visible_to_patient && (
                          <span className="mt-3 inline-flex rounded-full bg-risk-low-soft px-2.5 py-0.5 text-[11px] font-semibold text-risk-low ring-1 ring-inset ring-risk-low/25">
                            Visible to Patient ✓
                          </span>
                        )}
                      </>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        </div>
      )}
    </ClinicianLayout>
  );
}
