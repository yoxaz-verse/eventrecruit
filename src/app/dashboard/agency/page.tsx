import { Banknote, Building2, Plus } from "lucide-react";
import { recommendTalent } from "@/app/actions/workflow";
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

export default async function AgencyDashboard() {
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
            <button className="button button-primary" type="button"><Plus size={18} aria-hidden /> New post</button>
          </div>
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
          Match event talent to exhibitor needs using public profile signals only. Private contact details stay admin-only.
        </p>
        <div className="mt-5 grid gap-4">
          {applicants.map((talent) => (
            <form
              action={recommendTalent}
              className="surface-card grid gap-3 p-4 md:grid-cols-[1fr_220px_1fr_auto]"
              key={talent.id}
            >
              <input name="talent_id" type="hidden" value={talent.talentId} />
              <div>
                <strong>{talent.name}</strong>
                <p className="text-sm text-[var(--muted)]">
                  {talent.rating.toFixed(1)} rating · {talent.reliability}% reliable · {talent.languages.join(", ")}
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--accent)]">
                  {talent.name === "Aisha Rahman" ? talentReputation.trustScore : talent.reliability} trust score
                </p>
              </div>
              <label className="label">
                Recruitment need
                <select className="input" name="staffing_role_id">
                  {openRoles.map((role) => (
                    <option key={role.id} value={role.id}>{role.role}</option>
                  ))}
                </select>
              </label>
              <label className="label">
                Recommendation note
                <input className="input" name="note" placeholder="Why this person fits" />
              </label>
              <button className="button button-primary self-end" type="submit">Recommend</button>
            </form>
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
