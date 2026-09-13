import { WorkflowActionForm } from "@/components/workflow-action-form";
import { SubmitButton } from "@/components/submit-button";
import { ShieldCheck, SlidersHorizontal, UserCheck } from "lucide-react";
import { updateProfileVerification } from "@/app/actions/workflow";
import { ApplicantTable } from "@/components/applicant-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { ModerationTable } from "@/components/reputation/moderation-table";
import { ScoreSummaryCard } from "@/components/reputation/score-summary-card";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { metrics, reputations, testimonials } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  await requireRole(["admin"]);
  const db = await createClient();
  if (!db) throw new Error("Admin data is temporarily unavailable.");
  const [{ data: pendingProfiles, error: pendingError }, { data: contacts, error: contactsError }] = await Promise.all([
    db.from("profiles").select("id, full_name, role, city, verification_status").eq("verification_status", "pending_verification").neq("role", "admin").order("created_at", { ascending: true }).limit(100),
    db.from("contact_details").select("profile_id, phone, alternate_email").limit(100),
  ]);
  if (pendingError || contactsError) throw new Error("Unable to load admin records. Check the database policies and retry.");
  const contactProfiles = contacts?.length
    ? await db.from("profiles").select("id, full_name, role, city").in("id", contacts.map((contact) => contact.profile_id))
    : { data: [], error: null };
  if (contactProfiles.error) throw new Error("Unable to load contact profiles.");
  const profilesById = new Map(contactProfiles.data?.map((profile) => [profile.id, profile]));

  return (
    <DashboardShell active="admin">
      <div className="page-kicker">
        <span className="badge">Admin control</span>
        <h1 className="mt-3 text-4xl font-black">Marketplace oversight</h1>
        <p className="mt-2 text-[var(--muted)]">
          Verify users, monitor India-wide placements, and keep trust signals clean.
        </p>
      </div>
      <section className="grid-auto">
        <p className="text-sm text-[var(--muted)]">Illustrative marketplace metrics. The verification queue and contact vault below show current database records.</p>
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
            {pendingProfiles?.map((profile) => (
            <div className="surface-card p-4" key={profile.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <strong>{profile.full_name}</strong>
                    <p className="text-sm text-[var(--muted)]">{profile.role} · {profile.city || "Location pending"}</p>
                  </div>
                  <StatusBadge status={profile.verification_status} />
                </div>
                <div className="mt-3 flex gap-2">
                  <WorkflowActionForm action={updateProfileVerification}>
                    <input name="profile_id" type="hidden" value={profile.id} />
                    <input name="verification_status" type="hidden" value="verified" />
                    <SubmitButton className="button button-primary" pendingText="Verifying…">Verify</SubmitButton>
                  </WorkflowActionForm>
                  <WorkflowActionForm action={updateProfileVerification}>
                    <input name="profile_id" type="hidden" value={profile.id} />
                    <input name="verification_status" type="hidden" value="rejected" />
                    <SubmitButton className="button button-secondary" pendingText="Rejecting…">Reject</SubmitButton>
                  </WorkflowActionForm>
                </div>
              </div>
            ))}
            {!pendingProfiles?.length && <p className="text-[var(--muted)]">No profiles awaiting verification.</p>}
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
            <div className="surface-card p-4 font-bold" key={item}>{item}</div>
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
              {contacts?.map((contact) => (
                <tr key={contact.profile_id}>
                  <td>{profilesById.get(contact.profile_id)?.full_name ?? "Unknown"}</td>
                  <td>{profilesById.get(contact.profile_id)?.role ?? "Unknown"}</td>
                  <td>{profilesById.get(contact.profile_id)?.city ?? ""}</td>
                  <td>{contact.phone ?? ""}</td>
                  <td>{contact.alternate_email ?? ""}</td>
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
