import { Link, useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { loginAsClinician } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Clinician Login — FootSense";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center hero-gradient px-4">
      <div className="surface-card w-full max-w-md p-8 text-center shadow-elevated">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl brand-gradient">
          <Activity className="size-6 text-primary-foreground" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">FootSense</h1>
        <p className="mt-1 text-sm text-muted-foreground">Clinician sign in</p>

        <button
          onClick={() => {
            loginAsClinician();
            navigate("/dashboard");
          }}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.9-.1-1.7-.2-2.5H12v4.7h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"
            />
            <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8z" />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="mt-4 text-xs text-muted-foreground">
          You must have an approved application to sign in.
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
