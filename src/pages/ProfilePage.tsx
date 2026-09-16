import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClinicianLayout } from "@/components/layout/ClinicianLayout";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/RiskBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";

const specialties = [
  "Podiatry",
  "Endocrinology",
  "General Practice",
  "Vascular Surgery",
  "Orthopaedics",
  "Other",
];

const inputCls =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-ring/30";

export default function ProfilePage() {
  const { user: profile } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [specialty, setSpecialty] = useState(profile?.specialty ?? "");
  const [institution, setInstitution] = useState(profile?.institution ?? "");

  useEffect(() => {
    document.title = "My Profile — FootSense";
  }, []);

  if (!profile) return null;

  return (
    <ClinicianLayout>
      <PageHeader title="My Profile" subtitle="Your clinician account details" />

      <div className="surface-card max-w-3xl p-8">
        <div className="flex items-center gap-4">
          <Avatar initials={profile.avatar_initials} className="size-16 text-lg" />
          <div>
            <p className="text-lg font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">
              {specialty} · {institution}
            </p>
          </div>
        </div>

        <form
          className="mt-8 grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Profile updated successfully.");
          }}
        >
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Specialty</label>
            <select
              className={inputCls}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {specialties.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Institution</label>
            <input
              className={inputCls}
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">AHPRA Number</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <input
                      readOnly
                      disabled
                      value={profile.ahpra_number}
                      className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-input bg-muted px-3.5 py-2.5 font-mono text-sm text-muted-foreground"
                    />
                    <Lock className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Cannot be changed after registration</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="sm:col-span-2">
            <button className="rounded-lg brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5">
              Save Changes
            </button>
          </div>
        </form>

        <div className="mt-8 grid gap-4 border-t border-border pt-6 text-sm sm:grid-cols-2">
          <p className="text-muted-foreground">
            Member since:{" "}
            <span className="font-medium text-foreground">
              {profile.created_at ? formatDate(profile.created_at) : "—"}
            </span>
          </p>
          <p className="text-muted-foreground">
            Last login:{" "}
            <span className="font-medium text-foreground">
              {profile.last_login ? formatDate(profile.last_login) : "—"}
            </span>
          </p>
        </div>
      </div>
    </ClinicianLayout>
  );
}
