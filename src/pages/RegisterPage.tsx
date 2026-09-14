import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AHPRA_REGEX } from "@/controllers/authController";
import { validateRegistrationForm, type RegistrationFormErrors } from "@/controllers/registrationController";

const specialties = [
  "Podiatry",
  "Endocrinology",
  "General Practice",
  "Vascular Surgery",
  "Orthopaedics",
  "Other",
];

const inputCls =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30";

export default function RegisterPage() {
  const [form, setForm] = useState({
    ahpra: "",
    name: "",
    email: "",
    specialty: "Podiatry",
    institution: "",
  });
  const [errors, setErrors] = useState<RegistrationFormErrors>({});

  useEffect(() => {
    document.title = "Apply for Clinician Access — FootSense";
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = validateRegistrationForm(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    toast.success("Application submitted successfully!", {
      description: "Your application is under review. You can check your status anytime.",
    });
    setForm({ ahpra: "", name: "", email: "", specialty: "Podiatry", institution: "" });
  }

  return (
    <div className="min-h-screen hero-gradient px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
        <div className="surface-card mt-4 p-8 shadow-elevated">
          <h1 className="text-2xl font-bold tracking-tight">Apply for Clinician Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your details for verification. Your information will be securely encrypted.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <div>
              <label className="text-sm font-medium text-foreground">
                AHPRA Registration Number
              </label>
              <input
                className={inputCls}
                placeholder="MED0000000000"
                value={form.ahpra}
                onChange={(e) => setForm({ ...form, ahpra: e.target.value.toUpperCase() })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Format: 3 letters followed by 10 digits (e.g., MED0000932846)
              </p>
              {errors.ahpra && <p className="mt-1 text-xs text-destructive">{errors.ahpra}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input
                className={inputCls}
                placeholder="Dr. First Last"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <input
                type="email"
                className={inputCls}
                placeholder="you@hospital.com.au"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Specialty</label>
              <select
                className={inputCls}
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              >
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Institution</label>
              <input
                className={inputCls}
                placeholder="Royal Melbourne Hospital"
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
              />
              {errors.institution && (
                <p className="mt-1 text-xs text-destructive">{errors.institution}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg brand-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-transform duration-200 hover:-translate-y-0.5"
            >
              Submit Application
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in here
              </Link>
            </span>
            <Link
              to="/register/status"
              className="font-semibold text-primary hover:underline"
            >
              Check application status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
