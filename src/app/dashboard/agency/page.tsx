import { StaffingRequestForm } from "@/components/staffing-request-form";
import Link from "next/link";
import { Banknote, Building2, Plus } from "lucide-react";
import { ApplicantTable } from "@/components/applicant-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { CategoryScoreBars } from "@/components/reputation/category-score-bars";
import { ScoreSummaryCard } from "@/components/reputation/score-summary-card";
import { RoleCard } from "@/components/role-card";
import { requireRole } from "@/lib/auth";
import { applicants, openRoles, reputations } from "@/lib/mock-data";

const clients = [
  { name: "Nexa Exhibitions", activeRoles: 7, commission: "12%" },
  { name: "VoltEdge Motors", activeRoles: 4, commission: "Rs 1,500 per placement" },
  { name: "Meridian Foods", activeRoles: 2, commission: "10%" },
];

export default async function AgencyDashboard({ searchParams }: { searchParams?: Promise<{ new?: string; message?: string }> }) {
  const params = await searchParams;
  await requireRole(["agency", "admin"]);
  const talentReputation = reputations.find((reputation) => reputation.role === "talent")!;
  const exhibitorReputation = reputations.find((reputation) => reputation.role === "exhibitor")!;

  return (
    <DashboardShell active="agency">
      <div className="page-kicker">
        <span className="badge">Agency panel</span>
        <h1 className="mt-3 text-4xl font-black">Manage exhibitor clients</h1>
        <p className="mt-2 text-[var(--muted)]">
          Run event and retail staffing requests across Indian cities and track commission on filled placements.
        </p>
      </div>
      <section className="grid-auto">
        <p className="text-sm text-[var(--muted)]">Illustrative client examples; account-specific clients and commissions require live records.</p>
        {clients.map((client) => (
          <article className="panel p-5" key={client.name}>
            <div className="flex items-start justify-between gap-4">
              <Building2 className="text-[var(--accent)]" aria-hidden />
              <span className="badge">{client.activeRoles} active roles</span>
            </div>
            <h2 className="mt-4 text-xl font-black">{client.name}</h2>
            <p className="mt-2 text-[var(--muted)]">Commission: {client.commission}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <ScoreSummaryCard reputation={talentReputation} />
        <ScoreSummaryCard reputation={exhibitorReputation} />
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Client staffing posts</h2>
            <Link className="button button-primary" href="/dashboard/agency?new=1#new-post"><Plus size={18} aria-hidden /> New post</Link>
          </div>
          {params?.new === "1" ? <div className="mb-4"><StaffingRequestForm source="agency" /></div> : null}
          <div className="grid gap-4">
            {openRoles.filter((role) => role.agency).map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Banknote className="text-[var(--accent-2)]" aria-hidden />
            <h2 className="text-2xl font-black">Commission tracker</h2>
          </div>
          <div className="grid gap-3">
            {["Rs 3.8L pending", "Rs 9.6L approved", "Rs 82K disputed"].map((item) => (
              <div className="surface-card p-4 font-bold" key={item}>{item}</div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-8 panel p-5">
        <h2 className="text-2xl font-black">Recommend verified talent</h2>
        <p className="mt-2 text-[var(--muted)]">
          Example talent profiles are shown below. Recommendations require live talent and staffing records; private contact details stay admin-only.
        </p>
        <div className="mt-5 grid gap-4">
          {applicants.map((talent) => (
            <article className="surface-card p-4" key={talent.id}>
              <div>
                <strong>{talent.name}</strong>
                <p className="text-sm text-[var(--muted)]">
                  {talent.rating.toFixed(1)} rating · {talent.reliability}% reliable · {talent.languages.join(", ")}
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--accent)]">
                  {talent.name === "Aisha Rahman" ? talentReputation.trustScore : talent.reliability} trust score
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-black">Applications across clients</h2>
        <ApplicantTable />
      </section>
      <section className="mt-8">
        <CategoryScoreBars reputation={talentReputation} />
      </section>
    </DashboardShell>
  );
}
