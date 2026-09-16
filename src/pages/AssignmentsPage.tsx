import { Check, Cpu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClinicianLayout } from "@/components/layout/ClinicianLayout";
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
import { formatDate } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import * as assignmentController from "@/controllers/assignmentController";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [declineId, setDeclineId] = useState<string | null>(null);

  const { data: requests = [] } = useQuery({
    queryKey: ["assignments", "pending", user?.id],
    queryFn: () => (user?.id ? assignmentController.getClinicianAssignments(user.id) : []),
    enabled: !!user?.id,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => assignmentController.acceptAssignment(id),
    onSuccess: (_d, id) => {
      const req = requests.find((r) => r.id === id);
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success(`${req?.patient_first_name ?? "Patient"} added to your patient list.`);
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => assignmentController.declineAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast("Assignment request declined.");
      setDeclineId(null);
    },
  });

  useEffect(() => {
    document.title = "Assignment Requests — FootSense";
  }, []);

  const declining = requests.find((r) => r.id === declineId);

  return (
    <ClinicianLayout>
      <PageHeader
        title="Patient Assignment Requests"
        subtitle="Patients requesting you as their clinician"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {requests.filter((r) => r.status === "pending").map((r) => (
          <article key={r.id} className="surface-card p-6 transition-all duration-200 hover:shadow-elevated">
            <h2 className="text-lg font-semibold text-foreground">{r.patient_first_name} {r.patient_last_name}</h2>
            <p className="text-sm text-muted-foreground">{r.patient_email}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium">Age: {r.age}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium">
                {r.diabetes_type}
              </span>
              {r.device_model && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 font-mono font-medium text-accent-foreground">
                  <Cpu className="size-3" /> {r.device_model}
                </span>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Requested: {formatDate(r.requested_at)}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => acceptMutation.mutate(r.id)}
                disabled={acceptMutation.isPending}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-risk-low px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Check className="size-4" /> Accept
              </button>
              <button
                onClick={() => setDeclineId(r.id)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/40 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors duration-200 hover:bg-risk-high-soft"
              >
                <X className="size-4" /> Decline
              </button>
            </div>
          </article>
        ))}
        {requests.filter((r) => r.status === "pending").length === 0 && (
          <p className="surface-card p-10 text-center text-sm text-muted-foreground md:col-span-2">
            No pending assignment requests.
          </p>
        )}
      </div>

      <AlertDialog open={!!declineId} onOpenChange={(o) => !o && setDeclineId(null)}>
        <AlertDialogContent className="glass-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
            <AlertDialogDescription>
              {declining?.patient_first_name} will not be assigned to your care and will be prompted to
              select another clinician.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (declineId) declineMutation.mutate(declineId);
              }}
            >
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ClinicianLayout>
  );
}
