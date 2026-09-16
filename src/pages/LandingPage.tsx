import { Link } from "react-router-dom";
import {
  Activity,
  Cpu,
  HeartPulse,
  LineChart,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Users,
} from "lucide-react";
import { useEffect } from "react";

const features = [
  {
    icon: HeartPulse,
    title: "Thermal Monitoring",
    body: "Real-time foot temperature data from IoT sensors with 9-point bilateral clinical assessment.",
  },
  {
    icon: LineChart,
    title: "Risk Analytics",
    body: "Automated risk scoring and asymmetry detection to identify early signs of ulceration before tissue damage.",
  },
  {
    icon: Users,
    title: "Clinical Collaboration",
    body: "Secure clinician-patient assignment system with real-time triage alerts and personalized care instructions.",
  },
];

const pillars = [
  {
    icon: Thermometer,
    title: "2.2°C Temperature Biomarker",
    description:
      "Clinical evidence confirms a contralateral temperature asymmetry exceeding 2.2°C indicates localized subsurface inflammation up to one week prior to visible skin breakdown.",
  },
  {
    icon: Cpu,
    title: "IoT Sensor Plantar Mapping",
    description:
      "Continuous monitoring captures high-resolution thermal data across 9 anatomical zones per foot: hallux, toes, 1st/3rd/5th metatarsals, midfoot, and heel.",
  },
  {
    icon: Stethoscope,
    title: "AHPRA-Accredited Clinician Care",
    description:
      "Designed specifically for Australian podiatrists, endocrinologists, and high-risk foot clinics to triage patients proactively and prevent avoidable hospital admissions.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Role-Governed",
    description:
      "Strict data isolation and role-based access ensure clinicians only view their assigned patients, backed by end-to-end auditability and Australian privacy standards.",
  },
];

export default function LandingPage() {
  useEffect(() => {
    document.title = "FootSense — Intelligent Diabetic Foot Monitoring";
  }, []);

  return (
    <div className="flex min-h-screen flex-col hero-gradient">
      {/* Top Navigation */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl brand-gradient shadow-sm">
            <Activity className="size-5 text-primary-foreground" />
          </span>
          <span className="text-lg font-bold tracking-tight">FootSense</span>
        </div>

        {/* Replaced duplicate login with About Us and Status tracking */}
        <nav className="flex items-center gap-4 sm:gap-6 text-sm">
          <a
            href="#about"
            className="font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            About Us
          </a>
          <a
            href="#technology"
            className="hidden font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground sm:inline-block"
          >
            Technology
          </a>
          <Link
            to="/register/status"
            className="rounded-lg border border-border bg-card/70 px-3.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur transition-all duration-200 hover:bg-muted hover:border-primary/30"
          >
            Check Status
          </Link>
        </nav>
      </header>

      {/* Main Hero */}
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

          {/* Unified Login & Application Action Buttons */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="rounded-lg brand-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition-transform duration-200 hover:-translate-y-0.5"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-card transition-colors duration-200 hover:bg-muted"
            >
              Apply as Clinician
            </Link>
          </div>
        </section>

        {/* Feature Overview Grid */}
        <section className="grid gap-5 pb-16 md:grid-cols-3">
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

        {/* Dedicated About Us & Technology Section */}
        <section id="about" className="pt-4 pb-20 scroll-mt-8">
          <div className="surface-card overflow-hidden rounded-2xl border border-border p-8 md:p-12 shadow-elevated">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-accent-foreground ring-1 ring-inset ring-primary/20">
                About FootSense
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Pioneering Proactive Diabetic Foot Protection
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Diabetic Foot Ulcers (DFUs) represent one of the most severe complications of diabetes,
                frequently leading to localized infections, prolonged hospitalization, and avoidable lower-limb
                amputations. Peripheral neuropathy deprives patients of warning pain signals, leaving early tissue
                inflammation undetected until skin integrity is breached.
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                FootSense bridges this critical diagnostic gap. By pairing continuous thermal sensor telemetry
                with automated asymmetry analytics, our system flags dangerous temperature differentials days before
                ulcerations manifest physically — empowering Australian healthcare professionals to intervene early.
              </p>
            </div>

            {/* Metric Highlights */}
            <div className="mt-10 grid grid-cols-2 gap-4 border-y border-border py-8 md:grid-cols-4">
              <div>
                <p className="text-3xl font-extrabold text-primary md:text-4xl">&gt;2.2°C</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Asymmetry threshold for early ulcer prediction
                </p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-foreground md:text-4xl">9 Points</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Bilateral anatomical plantar mapping zones
                </p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-primary md:text-4xl">100%</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Automated triage alert dispatching
                </p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-foreground md:text-4xl">AHPRA</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Australian practitioner verified standard
                </p>
              </div>
            </div>

            {/* Technology Pillars */}
            <div id="technology" className="mt-12 scroll-mt-12">
              <h3 className="text-xl font-bold text-foreground">Our Technology & Clinical Pillars</h3>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="flex gap-4 rounded-xl border border-border/60 bg-muted/30 p-5 transition-colors duration-200 hover:bg-muted/60"
                  >
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
                      <pillar.icon className="size-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{pillar.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Healthcare Provider Callout */}
            <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-xl bg-brand-soft p-6 sm:flex-row">
              <div>
                <h4 className="text-base font-bold text-foreground">Are you an Australian healthcare provider?</h4>
                <p className="text-xs text-muted-foreground">
                  Join podiatrists and diabetic care teams monitoring high-risk patients with FootSense.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  to="/register"
                  className="rounded-lg brand-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Apply for Access
                </Link>
                <Link
                  to="/register/status"
                  className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-card transition-colors duration-200 hover:bg-muted"
                >
                  Check Status
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p>© 2025 FootSense. Developed for the Australian healthcare system.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <a href="#about" className="hover:text-foreground">
              About Us
            </a>
            <a href="#technology" className="hover:text-foreground">
              Technology
            </a>
            <Link to="/register/status" className="hover:text-foreground">
              Application Status
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
