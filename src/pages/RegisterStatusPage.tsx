import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/format";
import * as authController from "@/controllers/authController";
import type { ApplicationLookup } from "@/controllers/authController";

export default function RegisterStatusPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ApplicationLookup | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Check Application Status — FootSense";
  }, []);

  return (
    <div className="min-h-screen hero-gradient px-4 py-12">
      <div className="mx-auto w-full max-w-xl">
        <Link to="/register" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to application
        </Link>
        <div className="surface-card mt-4 p-8 shadow-elevated">
          <h1 className="text-2xl font-bold tracking-tight">Check Application Status</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your AHPRA number or email address to see where your application stands.
          </p>

          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setResult(authController.lookupApplicationStatus(query));
            }}
          >
            <input
              className="flex-1 rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-ring/30"
              placeholder="MED0000932846 or you@email.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="rounded-lg brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5">
              Check Status
            </button>
          </form>

          {result && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {result.found && result.status === "pending" && (
                <div className="rounded-xl border border-risk-moderate/30 bg-risk-moderate-soft p-5">
                  <p className="flex items-center gap-2 font-semibold text-risk-moderate">
                    <Clock className="size-5" /> Pending Review
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Application for <strong>{result.application.full_name}</strong> submitted on{" "}
                    {formatDate(result.application.submitted_at)}. Our verification team is
                    reviewing your AHPRA registration.
                  </p>
                </div>
              )}
              {result.found && result.status === "approved" && (
                <div className="rounded-xl border border-risk-low/30 bg-risk-low-soft p-5">
                  <p className="flex items-center gap-2 font-semibold text-risk-low">
                    <CheckCircle2 className="size-5" /> Approved ✅ — You can now sign in.
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="mt-4 rounded-lg brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    Sign In
                  </button>
                </div>
              )}
              {!result.found && (
                <div className="rounded-xl border border-border bg-muted p-5">
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    <SearchX className="size-5 text-muted-foreground" /> No application found.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Double-check the AHPRA number or email you used when applying.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
