import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { ApplicationCard } from "@/components/ApplicationCard";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import * as adminController from "@/controllers/adminController";
import type { ApplicationStatus } from "@/types";

export default function AdminApplicationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ApplicationStatus>("pending");
  const [approveId, setApproveId] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data: apps = [] } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => adminController.getApplicationList(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      adminController.updateApplicationStatus(id, "approved", user?.id ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Application approved.");
      setApproveId(null);
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, declineReason }: { id: string; declineReason?: string }) =>
      adminController.updateApplicationStatus(id, "declined", user?.id ?? "", declineReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast("Application declined.");
      setDeclineId(null);
    },
  });

  useEffect(() => {
    document.title = "Clinician Applications — FootSense Admin";
  }, []);

  const approving = apps.find((a) => a.id === approveId);
  const declining = apps.find((a) => a.id === declineId);
  const visible = apps.filter((a) => a.status === tab);
  const pendingCount = apps.filter((a) => a.status === "pending").length;

  const tabs: { key: ApplicationStatus; label: string }[] = [
    { key: "pending", label: `Pending (${pendingCount})` },
    { key: "approved", label: "Approved" },
    { key: "declined", label: "Declined" },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Clinician Applications"
        subtitle="Review and verify pending clinician registrations."
      />

      <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              tab === t.key
                ? "brand-gradient text-primary-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visible.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            onApprove={() => setApproveId(app.id)}
            onDecline={() => {
              setReason("");
              setDeclineId(app.id);
            }}
          />
        ))}
        {visible.length === 0 && (
          <p className="surface-card p-10 text-center text-sm text-muted-foreground">
            No applications in this tab.
          </p>
        )}
      </div>

      <AlertDialog open={!!approveId} onOpenChange={(o) => !o && setApproveId(null)}>
        <AlertDialogContent className="glass-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Approve {approving?.full_name}'s application?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to sign in after approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (approveId) approveMutation.mutate(approveId);
              }}
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!declineId} onOpenChange={(o) => !o && setDeclineId(null)}>
        <DialogContent className="glass-panel">
          <DialogHeader>
            <DialogTitle>Decline {declining?.full_name}'s application</DialogTitle>
            <DialogDescription>
              You can optionally add a reason. It will be recorded with the application.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason (optional)"
            className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
          <DialogFooter>
            <button
              onClick={() => setDeclineId(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (declineId) declineMutation.mutate(reason ? { id: declineId, declineReason: reason } : { id: declineId });
              }}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-transform duration-200 hover:-translate-y-0.5"
            >
              Decline Application
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
