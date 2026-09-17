import { Loader2, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
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
  const { isRootAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: clinicians = [] } = useQuery({
    queryKey: ["admin", "clinicians"],
    queryFn: () => adminController.getRegisteredClinicianList(),
  });

  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [promoteId, setPromoteId] = useState<string | null>(null);
  const [demoteId, setDemoteId] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    document.title = "Clinician Management — FootSense Admin";
  }, []);

  const pending = clinicians.find((c) => c.id === pendingId);
  const promotePending = clinicians.find((c) => c.id === promoteId);
  const demotePending = clinicians.find((c) => c.id === demoteId);

  const handleStatusToggleConfirm = async () => {
    if (!pending) return;
    const nextStatus = pending.status === "active" ? "suspended" : "active";
    setIsUpdatingStatus(true);
    try {
      await adminController.updateClinicianStatus(pending.id, nextStatus);
      toast.success(
        `${pending.first_name} ${pending.last_name}'s account has been ${
          nextStatus === "active" ? "reactivated" : "suspended"
        }.`
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "clinicians"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
      ]);
      setPendingId(null);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(err.message || "Failed to update clinician status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePromoteConfirm = async () => {
    if (!promotePending) return;
    setIsPromoting(true);
    try {
      await adminController.promoteClinicianToAdmin(promotePending.id);
      toast.success(`${promotePending.first_name} ${promotePending.last_name} has been promoted to Administrator.`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "clinicians"] });
      setPromoteId(null);
    } catch (err: any) {
      console.error("Promotion failed:", err);
      toast.error(err.message || "Failed to promote clinician to admin.");
    } finally {
      setIsPromoting(false);
    }
  };

  const handleDemoteConfirm = async () => {
    if (!demotePending) return;
    setIsDemoting(true);
    try {
      await adminController.demoteAdminToClinician(demotePending.id);
      toast.success(`${demotePending.first_name} ${demotePending.last_name} has been demoted to Clinician.`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "clinicians"] });
      setDemoteId(null);
    } catch (err: any) {
      console.error("Demotion failed:", err);
      toast.error(err.message || "Failed to demote administrator.");
    } finally {
      setIsDemoting(false);
    }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clinicians;
    return clinicians.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        c.ahpra_number.toLowerCase().includes(q) ||
        c.institution.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
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
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">AHPRA Number</th>
                <th className="px-5 py-3 font-semibold">Specialty</th>
                <th className="px-5 py-3 font-semibold">Institution</th>
                <th className="px-5 py-3 font-semibold">Patients</th>
                <th className="px-5 py-3 font-semibold">Account Status</th>
                <th className="px-5 py-3 font-semibold">Last Login</th>
                <th className="px-5 py-3 text-right font-semibold whitespace-nowrap min-w-[190px]">Role Management</th>
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
                    <p className="font-semibold text-foreground">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {c.is_admin ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                        <ShieldCheck className="size-3.5" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Clinician
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-brand-soft px-2 py-1 font-mono text-xs font-semibold text-accent-foreground">
                      {c.ahpra_number}
                    </span>
                  </td>
                  <td className="px-5 py-3">{c.specialty}</td>
                  <td className="px-5 py-3">{c.institution}</td>
                  <td className="px-5 py-3 tabular-nums">{c.patient_count}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="inline-flex items-center gap-2.5">
                      <Switch
                        checked={c.status === "active"}
                        onCheckedChange={() => setPendingId(c.id)}
                        aria-label={`Toggle account status for ${c.first_name} ${c.last_name}`}
                        title={
                          c.status === "active"
                            ? "Active account — click to suspend clinician access"
                            : "Suspended account — click to reactivate clinician access"
                        }
                      />
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          c.status === "active"
                            ? "bg-risk-low-soft text-risk-low ring-risk-low/25"
                            : "bg-risk-high-soft text-risk-high ring-risk-high/25"
                        }`}
                      >
                        {c.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{formatDate(c.last_login)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end">
                      {!c.is_admin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPromoteId(c.id)}
                          className="h-8 gap-1.5 whitespace-nowrap rounded-lg border-border bg-card px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
                          title="Promote to Administrator while keeping Clinician profile intact"
                        >
                          <ShieldCheck className="size-3.5 text-primary" />
                          <span>Promote to Admin</span>
                        </Button>
                      ) : isRootAdmin && c.email.toLowerCase() !== "foot.sense.monash@gmail.com" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDemoteId(c.id)}
                          className="h-8 gap-1.5 whitespace-nowrap rounded-lg border-border bg-card px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive active:scale-[0.98]"
                          title="Demote administrator back to clinician only"
                        >
                          <ShieldAlert className="size-3.5 text-muted-foreground transition-colors group-hover:text-destructive" />
                          <span>Demote to Clinician</span>
                        </Button>
                      ) : (
                        <span className="inline-flex h-8 items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground/80">
                          <ShieldCheck className="size-3.5 text-primary" />
                          <span>Admin Access</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                    No clinicians match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend / Reactivate Modal */}
      <AlertDialog open={!!pendingId} onOpenChange={(o) => !o && !isUpdatingStatus && setPendingId(null)}>
        <AlertDialogContent className="glass-panel max-w-md">
          <AlertDialogHeader>
            <div
              className={`mb-2 inline-flex size-10 items-center justify-center rounded-xl ${
                pending?.status === "active" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
              }`}
            >
              <ShieldAlert className="size-6" />
            </div>
            <AlertDialogTitle>
              {pending?.status === "active" ? "Suspend" : "Reactivate"} {pending?.first_name} {pending?.last_name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              {pending?.status === "active" ? (
                <p>
                  Suspending this clinician immediately disables their access to patient data and clinical assessment tools until reactivated.
                </p>
              ) : (
                <p>
                  Reactivating this account restores the clinician's full access to their assigned patients and platform features.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleStatusToggleConfirm();
              }}
              disabled={isUpdatingStatus}
              className={
                pending?.status === "active"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }
            >
              {isUpdatingStatus ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Updating…
                </span>
              ) : pending?.status === "active" ? (
                "Suspend Clinician"
              ) : (
                "Reactivate Clinician"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote to Admin Confirmation Modal */}
      <AlertDialog open={!!promoteId} onOpenChange={(o) => !o && !isPromoting && setPromoteId(null)}>
        <AlertDialogContent className="glass-panel max-w-md">
          <AlertDialogHeader>
            <div className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <AlertDialogTitle>
              Promote {promotePending?.first_name} {promotePending?.last_name} to Administrator?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <p>
                This action grants full Administrator access to review clinician registrations and manage the platform.
              </p>
              <p className="rounded-lg border border-border bg-accent/40 p-2.5 text-xs text-foreground">
                <strong>Dual-role preservation:</strong> Their clinician profile, patient assignments, and clinical history will remain completely untouched. They can seamlessly switch between the Clinician and Admin portals at any time.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPromoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePromoteConfirm();
              }}
              disabled={isPromoting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPromoting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Promoting…
                </span>
              ) : (
                "Grant Admin Access"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demote from Admin Confirmation Modal (Root Admin Only) */}
      <AlertDialog open={!!demoteId} onOpenChange={(o) => !o && !isDemoting && setDemoteId(null)}>
        <AlertDialogContent className="glass-panel max-w-md">
          <AlertDialogHeader>
            <div className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <ShieldAlert className="size-6" />
            </div>
            <AlertDialogTitle>
              Demote {demotePending?.first_name} {demotePending?.last_name} to Clinician?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <p>
                This will revoke Administrator privileges for this user. They will no longer have access to the Admin portal or clinician application approvals.
              </p>
              <p className="rounded-lg border border-border bg-accent/40 p-2.5 text-xs text-foreground">
                <strong>Clinical data preserved:</strong> Their clinician profile, patient records, measurements, and clinical history will remain completely unaffected.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDemoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDemoteConfirm();
              }}
              disabled={isDemoting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDemoting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Demoting…
                </span>
              ) : (
                "Demote to Clinician"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

