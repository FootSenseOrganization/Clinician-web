import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignOutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmText?: string;
}

export function SignOutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you sure you want to sign out?",
  description = "You will be signed out of your current session. You will need to authenticate again to access patient telemetry and clinical records.",
  confirmText = "Sign Out",
}: SignOutConfirmDialogProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsSigningOut(true);
      await onConfirm();
    } finally {
      setIsSigningOut(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
        <AlertDialogHeader className="space-y-3">
          <div className="mx-auto sm:mx-0 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <LogOut className="size-6" />
          </div>
          <div>
            <AlertDialogTitle className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            disabled={isSigningOut}
            className="rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSigningOut}
            className={cn(
              buttonVariants({ variant: "destructive" }),
              "rounded-xl px-5 py-2 text-sm font-semibold shadow-md",
            )}
          >
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing out…
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
