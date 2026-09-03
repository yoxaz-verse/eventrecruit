import { ShieldCheck, SlidersHorizontal, UserCheck } from "lucide-react";
import { updateProfileVerification } from "@/app/actions/workflow";
import { ApplicantTable } from "@/components/applicant-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { ModerationTable } from "@/components/reputation/moderation-table";
import { ScoreSummaryCard } from "@/components/reputation/score-summary-card";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { metrics, privateContacts, reputations, testimonials } from "@/lib/mock-data";

const pendingProfiles = [
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Aisha Rahman",
    type: "Event Talent",
    status: "pending_verification",
    city: "Dubai",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Nexa Exhibitions Manager",
    type: "Exhibitor",
    status: "pending_verification",
    city: "Dubai",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Prime Booth Talent",
    type: "Agency",
    status: "pending_verification",
    city: "Dubai",
  },
];

export default async function AdminDashboard() {
  await requireRole(["admin"]);

  return (
    <DashboardShell active="admin">
      <div className="mb-8">
        <span className="badge">Admin control</span>
        <h1 className="mt-3 text-4xl font-black">Marketplace oversight</h1>
        <p className="mt-2 text-[var(--muted)]">
          Verify users, monitor placements, and keep trust signals clean.
        </p>
      </div>
      <section className="grid-auto">
        {metrics.map((metric) => (
          <div className="panel p-5" key={metric.label}>
            <p className="text-sm font-bold text-[var(--muted)]">{metric.label}</p>
            <strong className="mt-2 block text-3xl">{metric.value}</strong>
            <p className="mt-1 text-sm text-[var(--muted)]">{metric.detail}</p>
          </div>
        ))}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {reputations.map((reputation) => (
          <ScoreSummaryCard key={reputation.profileId} reputation={reputation} />
        ))}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="text-[var(--accent)]" aria-hidden />
            <h2 className="text-2xl font-black">Verification queue</h2>
          </div>
          <div className="grid gap-3">
            {pendingProfiles.map((profile) => (
              <div className="rounded-lg border border-[var(--line)] bg-white p-4" key={profile.name}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <strong>{profile.name}</strong>
                    <p className="text-sm text-[var(--muted)]">{profile.type} · {profile.city}</p>
                  </div>
                  <StatusBadge status={profile.status} />
                </div>
                <div className="mt-3 flex gap-2">
                  <form action={updateProfileVerification}>
                    <input name="profile_id" type="hidden" value={profile.id} />
                    <input name="verification_status" type="hidden" value="verified" />
                    <button className="button button-primary" type="submit">Verify</button>
                  </form>
                  <form action={updateProfileVerification}>
                    <input name="profile_id" type="hidden" value={profile.id} />
                    <input name="verification_status" type="hidden" value="rejected" />
                    <button className="button button-secondary" type="submit">Reject</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="text-[var(--accent-2)]" aria-hidden />
            <h2 className="text-2xl font-black">Score controls</h2>
          </div>
          <ApplicantTable />
        </div>
      </section>
      <section className="mt-8 panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="text-[var(--accent)]" aria-hidden />
          <h2 className="text-2xl font-black">Policy defaults</h2>
        </div>
        <div className="grid-auto">
          {["Event talent require admin verification before placement", "Private contact details are admin-only", "Agency commissions are tracked but paid offline"].map((item) => (
            <div className="rounded-lg bg-white p-4 font-bold" key={item}>{item}</div>
          ))}
        </div>
      </section>
      <section className="mt-8 panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="text-[var(--accent-2)]" aria-hidden />
          <h2 className="text-2xl font-black">Admin-only contact vault</h2>
        </div>
        <p className="mb-4 text-[var(--muted)]">
          These fields come from the private contact table. They are not exposed to exhibitors,
          agencies, or event talent views.
        </p>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>City</th>
                <th>Phone</th>
                <th>Alternate email</th>
              </tr>
            </thead>
            <tbody>
              {privateContacts.map((contact) => (
                <tr key={contact.profileId}>
                  <td>{contact.name}</td>
                  <td>{contact.role}</td>
                  <td>{contact.city}</td>
                  <td>{contact.phone}</td>
                  <td>{contact.alternateEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-black">Review moderation</h2>
        <ModerationTable testimonials={testimonials} />
      </section>
    </DashboardShell>
  );
}
