import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/utils/format";
import * as adminController from "@/controllers/adminController";
import type { RegisteredClinician } from "@/types";

export default function AdminCliniciansPage() {
  const { data: clinicians = [] } = useQuery({
    queryKey: ["admin", "clinicians"],
    queryFn: () => adminController.getRegisteredClinicianList(),
  });

  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Clinician Management — FootSense Admin";
  }, []);

  const pending = clinicians.find((c) => c.id === pendingId);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clinicians;
    return clinicians.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ahpra_number.toLowerCase().includes(q) ||
        c.institution.toLowerCase().includes(q),
    );
  }, [clinicians, search]);

  return (
    <AdminLayout>
      <PageHeader title="Clinician Management" subtitle="Registered clinicians on the platform" />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, AHPRA number or institution..."
          className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">AHPRA Number</th>
                <th className="px-5 py-3 font-semibold">Specialty</th>
                <th className="px-5 py-3 font-semibold">Institution</th>
                <th className="px-5 py-3 font-semibold">Patients</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Last Login</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-border transition-colors duration-150 hover:bg-accent/60 ${
                    i % 2 === 1 ? "bg-muted/30" : ""
                  }`}
                >
                  <td className="px-5 py-3">
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-brand-soft px-2 py-1 font-mono text-xs font-semibold text-accent-foreground">
                      {c.ahpra_number}
                    </span>
                  </td>
                  <td className="px-5 py-3">{c.specialty}</td>
                  <td className="px-5 py-3">{c.institution}</td>
                  <td className="px-5 py-3 tabular-nums">{c.patient_count}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        c.status === "active"
                          ? "bg-risk-low-soft text-risk-low ring-risk-low/25"
                          : "bg-risk-high-soft text-risk-high ring-risk-high/25"
                      }`}
                    >
                      {c.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{formatDate(c.last_login)}</td>
                  <td className="px-5 py-3 text-right">
                    <Switch
                      checked={c.status === "active"}
                      onCheckedChange={() => setPendingId(c.id)}
                      aria-label="Toggle clinician access"
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                    No clinicians match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!pendingId} onOpenChange={(o) => !o && setPendingId(null)}>
        <AlertDialogContent className="glass-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.status === "active" ? "Suspend" : "Reactivate"} {pending?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.status === "active"
                ? "They will immediately lose access to patient data until reactivated."
                : "They will regain full access to their assigned patients."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.success("Clinician status updated.");
                setPendingId(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
