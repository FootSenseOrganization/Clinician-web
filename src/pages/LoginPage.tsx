import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Clinician Login — FootSense";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await loginWithEmail(email);
    setSubmitting(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error ?? "Login failed.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center hero-gradient px-4">
      <div className="surface-card w-full max-w-md p-8 text-center shadow-elevated">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl brand-gradient">
          <Activity className="size-6 text-primary-foreground" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">FootSense</h1>
        <p className="mt-1 text-sm text-muted-foreground">Clinician sign in</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-risk-high-soft px-3 py-2 text-xs font-medium text-risk-high">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Sign in with your registered clinician email.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Don't have access?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Apply here
          </Link>
        </p>
      </div>
    </div>
  );
}
