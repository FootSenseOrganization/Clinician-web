import { Link, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Admin Sign In — FootSense";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await loginWithEmail(email);
    setSubmitting(false);
    if (result.success) {
      navigate("/admin/dashboard");
    } else {
      setError(result.error ?? "Login failed.");
    }
  };

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-3.5 py-2.5 text-sm text-sidebar-accent-foreground outline-none transition-all duration-200 placeholder:text-sidebar-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="sidebar-gradient flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/10">
          <ShieldCheck className="size-6 text-primary" />
        </span>
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-sidebar-accent-foreground">
          FootSense Admin
        </h1>
        <p className="mt-1 text-center text-sm text-sidebar-foreground/60">
          Restricted access — authorised personnel only.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-sidebar-foreground/80">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/40" />
              <input
                type="email"
                className={inputCls}
                placeholder="foot.sense.monash@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-risk-high/20 px-3 py-2 text-xs font-medium text-risk-high">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 block text-center text-xs text-sidebar-foreground/50 transition-colors hover:text-sidebar-accent-foreground"
        >
          ← Return to FootSense
        </Link>
      </div>
    </div>
  );
}
