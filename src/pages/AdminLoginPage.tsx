import { Link, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    document.title = "Admin Sign In — FootSense";
  }, []);

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-sidebar-accent-foreground outline-none transition-all duration-200 placeholder:text-sidebar-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/30";

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

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            loginAsAdmin();
            navigate("/admin/dashboard");
          }}
        >
          <div>
            <label className="text-sm font-medium text-sidebar-foreground/80">Username</label>
            <input
              className={inputCls}
              placeholder="administrator"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-sidebar-foreground/80">Password</label>
            <input
              type="password"
              className={inputCls}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5">
            <Lock className="size-4" /> Sign In
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
