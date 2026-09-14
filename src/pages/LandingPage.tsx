import { Link } from "react-router-dom";
import { Activity, HeartPulse, LineChart, Users } from "lucide-react";
import { useEffect } from "react";

const features = [
  {
    icon: HeartPulse,
    title: "Thermal Monitoring",
    body: "Real-time foot temperature data from IoT sensors with 9-point clinical assessment.",
  },
  {
    icon: LineChart,
    title: "Risk Analytics",
    body: "Automated risk scoring and asymmetry detection to identify early signs of ulceration.",
  },
  {
    icon: Users,
    title: "Clinical Collaboration",
    body: "Secure clinician-patient assignment system with real-time alerts and instructions.",
  },
];

export default function LandingPage() {
  useEffect(() => {
    document.title = "FootSense — Intelligent Diabetic Foot Monitoring";
  }, []);

  return (
    <div className="flex min-h-screen flex-col hero-gradient">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-xl brand-gradient">
            <Activity className="size-5 text-primary-foreground" />
          </span>
          <span className="text-lg font-bold tracking-tight">FootSense</span>
        </div>
        <Link
          to="/login"
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          Clinician Login
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-accent-foreground ring-1 ring-inset ring-primary/20">
            Built for Australian healthcare professionals
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            FootSense
          </h1>
          <p className="mt-3 text-xl font-semibold text-primary md:text-2xl">
            Intelligent Diabetic Foot Monitoring
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            An AI-powered thermal imaging platform helping clinicians detect diabetic foot ulcer
            risk early through continuous temperature monitoring and clinical-grade analytics.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="rounded-lg brand-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition-transform duration-200 hover:-translate-y-0.5"
            >
              Clinician Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-card transition-colors duration-200 hover:bg-muted"
            >
              Apply as Clinician
            </Link>
          </div>
          <Link
            to="/admin"
            className="mt-5 inline-block text-xs font-medium text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline"
          >
            Admin Access
          </Link>
        </section>

        <section className="grid gap-5 pb-20 md:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="surface-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-elevated"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-primary">
                <f.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © 2025 FootSense. Developed for the Australian healthcare system.
      </footer>
    </div>
  );
}
