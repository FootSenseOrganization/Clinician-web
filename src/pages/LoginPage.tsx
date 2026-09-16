import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { signInWithGoogle, role, loading, isAuthenticated, authEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Sign In — FootSense";
  }, []);

  // After Google auth resolves, redirect based on role
  useEffect(() => {
    if (loading) return;
    if (role === "clinician") {
      navigate("/dashboard", { replace: true });
    } else if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (isAuthenticated && !role) {
      // Authenticated via Google but no clinician/admin role in the system
      setError(
        `No clinician or administrator account found for ${authEmail}. Please apply for access or contact your administrator.`,
      );
    }
  }, [loading, role, isAuthenticated, authEmail, navigate]);

  const handleGoogleSignIn = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle("/login");
      // Browser will redirect to Google — this code won't continue
    } catch {
      setError("Failed to initiate Google sign-in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center hero-gradient px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back to landing page button */}
        <Link
          to="/"
          className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Back to FootSense</span>
        </Link>

        <div className="surface-card w-full p-8 text-center shadow-elevated">
          <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl brand-gradient">
            <Activity className="size-6 text-primary-foreground" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">FootSense</h1>
          <p className="mt-1 text-sm text-muted-foreground">Portal sign in</p>

          <div className="mt-8 space-y-4">
            {error && (
              <p className="rounded-lg bg-risk-high-soft px-3 py-2 text-xs font-medium text-risk-high">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting || loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card disabled:opacity-60 disabled:translate-y-0"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {submitting ? "Redirecting…" : "Sign in with Google"}
            </button>

            <p className="text-xs text-muted-foreground">
              Sign in with your registered Google account.
            </p>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Don't have access?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Apply here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
