import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Calendar,
  Star,
  Award,
  User,
  MapPin,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Activity,
  DollarSign,
  CheckCircle2,
  Layers
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusBadge } from "@/components/status-badge";
import type { AdminDetailGroup, AdminOrganizationDetail } from "@/lib/admin-organization-detail";

function getPluralKindLabel(kindLabel: string) {
  const lower = kindLabel.toLowerCase();
  if (lower.includes("agency")) return "Agencies";
  if (lower.includes("company")) return "Organizer Companies";
  if (lower.includes("exhibitor")) return "Exhibitors";
  return `${kindLabel}s`;
}

function formatDateValue(value: string) {
  if (!value || value === "—") return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  if (!name) return "ORG";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function isIsoDate(str: string) {
  return typeof str === "string" && /^\d{4}-\d{2}-\d{2}T/.test(str);
}

function isVerificationField(label: string) {
  const l = label.toLowerCase();
  return l.includes("verification") || l === "status";
}

function FieldValue({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") {
    return <span className="text-sm font-semibold text-[var(--muted)]">—</span>;
  }

  if (isVerificationField(label)) {
    return <StatusBadge status={value} />;
  }

  if (isIsoDate(value)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)]">
        <Clock size={13} className="text-[var(--muted)]" />
        {formatDateValue(value)}
      </span>
    );
  }

  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes("phone")) {
    return (
      <a
        href={`tel:${value}`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline"
      >
        <Phone size={13} />
        <span>{value}</span>
      </a>
    );
  }

  if (lowerLabel.includes("email")) {
    return (
      <a
        href={`mailto:${value}`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline break-all"
      >
        <Mail size={13} />
        <span>{value}</span>
      </a>
    );
  }

  if (lowerLabel.includes("website")) {
    const href = value.startsWith("http") ? value : `https://${value}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline break-all"
      >
        <span>{value}</span>
        <ExternalLink size={13} />
      </a>
    );
  }

  return <span className="text-sm font-bold text-[var(--foreground)] break-words whitespace-pre-wrap">{value}</span>;
}

function Groups({ groups }: { groups: AdminDetailGroup[] }) {
  return (
    <div className="grid gap-6">
      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
              <Layers size={14} className="text-[var(--accent)]" />
              {group.title}
            </h3>
            <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-bold text-[var(--muted)] border border-[var(--line)]">
              {group.items.length} {group.items.length === 1 ? "record" : "records"}
            </span>
          </div>

          {group.items.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map((entry) => (
                <article
                  className="group relative rounded-2xl border border-[var(--line)] bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5"
                  key={`${group.title}-${entry.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <strong className="block font-extrabold text-[var(--foreground)] break-words group-hover:text-blue-600 transition-colors">
                        {entry.title}
                      </strong>
                      {entry.description ? (
                        <p className="mt-1 break-words text-xs text-[var(--muted)] leading-relaxed">
                          {entry.description}
                        </p>
                      ) : null}
                    </div>
                    {entry.status ? <StatusBadge status={entry.status} /> : null}
                  </div>
                  {entry.date ? (
                    <div className="mt-3 pt-2.5 border-t border-[var(--line)]/60 flex items-center justify-between text-xs text-[var(--muted)] font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {formatDateValue(entry.date)}
                      </span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)]/50 p-6 text-center">
              <p className="text-xs font-semibold text-[var(--muted)]">
                No {group.title.toLowerCase()} recorded for this organization.
              </p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function Accordion({
  title,
  icon: Icon,
  count,
  children,
  open = false,
}: {
  title: string;
  icon?: React.ElementType;
  count?: number;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="group rounded-3xl border border-[var(--line)] bg-white shadow-xs overflow-hidden transition-all" open={open}>
      <summary className="cursor-pointer list-none px-6 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] select-none hover:bg-[var(--surface)]/60 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                <Icon size={18} />
              </span>
            ) : null}
            <div>
              <h2 className="text-lg font-black tracking-tight text-[var(--foreground)]">
                {title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {typeof count === "number" ? (
              <span className="inline-flex items-center rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-extrabold text-[var(--muted)] border border-[var(--line)]">
                {count} {count === 1 ? "section" : "sections"}
              </span>
            ) : null}
            <ChevronDown
              size={18}
              className="text-[var(--muted)] transition-transform duration-200 group-open:rotate-180"
            />
          </div>
        </div>
      </summary>
      <div className="border-t border-[var(--line)] p-6 bg-slate-50/40">{children}</div>
    </details>
  );
}

export function AdminOrganizationDetailPage({ detail }: { detail: AdminOrganizationDetail }) {
  const verificationField = detail.overview.find((f) => isVerificationField(f.label));
  const phoneField = detail.overview.find((f) => f.label.toLowerCase().includes("phone"));
  const emailField = detail.overview.find((f) => f.label.toLowerCase().includes("email"));
  const ownerField = detail.overview.find((f) => f.label.toLowerCase() === "account owner");
  const ownerLocationField = detail.overview.find((f) => f.label.toLowerCase() === "owner location");
  const ownerPhoneField = detail.overview.find((f) => f.label.toLowerCase() === "owner phone");
  const ownerEmailField = detail.overview.find((f) => f.label.toLowerCase() === "owner email");
  const ownerVerificationField = detail.overview.find((f) => f.label.toLowerCase() === "owner verification");

  const ratingField = detail.overview.find((f) => f.label.toLowerCase().includes("rating"));
  const reliabilityField = detail.overview.find((f) => f.label.toLowerCase().includes("reliability"));
  const completedEventsField = detail.overview.find((f) => f.label.toLowerCase().includes("completed events"));
  const commissionField = detail.overview.find((f) => f.label.toLowerCase().includes("commission"));

  // Categorize overview items into structured sections
  const ownerLabels = ["account owner", "owner location", "owner verification", "owner phone", "owner email"];
  const metricLabels = ["reliability", "average rating", "completed events", "cancellations", "disputes"];

  const companyFields = detail.overview.filter(
    (f) => !ownerLabels.includes(f.label.toLowerCase()) && !metricLabels.includes(f.label.toLowerCase())
  );
  const ownerFields = detail.overview.filter((f) => ownerLabels.includes(f.label.toLowerCase()));
  const metricFields = detail.overview.filter((f) => metricLabels.includes(f.label.toLowerCase()));

  return (
    <DashboardShell active="admin" current="/dashboard/admin/organizations">
      {/* Top Back Navigation Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-extrabold text-[var(--foreground)] shadow-xs transition-all hover:bg-[var(--surface)] hover:border-blue-400 hover:text-blue-600"
          href={`/dashboard/admin/organizations?view=${detail.type}`}
        >
          <ArrowLeft size={14} />
          <span>Back to {getPluralKindLabel(detail.kindLabel)}</span>
        </Link>
        <span className="text-xs font-mono font-medium text-[var(--muted)] hidden sm:inline-block bg-white px-3 py-1.5 rounded-xl border border-[var(--line)] shadow-2xs">
          ID: <span className="font-bold text-[var(--foreground)]">{detail.id}</span>
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl mb-8 border border-slate-800">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-xl font-black text-white shadow-lg border border-white/20">
              {getInitials(detail.name)}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-200 backdrop-blur-md border border-white/10">
                  <Building2 size={12} />
                  {detail.kindLabel}
                </span>
                {verificationField ? <StatusBadge status={verificationField.value} /> : null}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white break-words">
                {detail.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Company profile, event participation, platform activity, and financial records inside Exporb Portal.
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            {phoneField && phoneField.value !== "—" ? (
              <a
                href={`tel:${phoneField.value}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 text-xs font-bold transition-all border border-white/10 backdrop-blur-md shadow-xs"
              >
                <Phone size={14} className="text-blue-400" />
                <span>Call Phone</span>
              </a>
            ) : null}

            {ownerEmailField && ownerEmailField.value !== "—" ? (
              <a
                href={`mailto:${ownerEmailField.value}`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-xs font-extrabold transition-all shadow-md shadow-blue-900/40"
              >
                <Mail size={14} />
                <span>Email Owner</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Top 4 KPI Highlight Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            <span>Verification Status</span>
            <ShieldCheck size={16} className="text-blue-600" />
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            {verificationField ? (
              <StatusBadge status={verificationField.value} />
            ) : (
              <span className="text-sm font-bold text-[var(--muted)]">Unknown</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            <span>Reliability Score</span>
            <Award size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--foreground)]">
              {reliabilityField ? reliabilityField.value : "100"}
            </span>
            <span className="text-xs font-bold text-[var(--muted)]">/ 100</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            <span>Average Rating</span>
            <Star size={16} className="text-amber-500 fill-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--foreground)]">
              {ratingField ? ratingField.value : "0"}
            </span>
            <span className="text-xs font-bold text-[var(--muted)]">Stars</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            <span>Completed Events</span>
            <Calendar size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--foreground)]">
              {completedEventsField ? completedEventsField.value : "0"}
            </span>
            <span className="text-xs font-bold text-[var(--muted)]">Events</span>
          </div>
        </div>
      </div>

      {/* Main Accordion Sections */}
      <div className="grid gap-6">
        <Accordion open title="Company Overview" icon={Building2}>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1: Organization Attributes */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
                <Building2 size={16} className="text-blue-600" />
                <h3 className="font-extrabold text-sm text-[var(--foreground)]">Organization Details</h3>
              </div>
              <dl className="space-y-3.5">
                {companyFields.map((field) => (
                  <div key={field.label} className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      {field.label}
                    </dt>
                    <dd className="mt-0.5">
                      <FieldValue label={field.label} value={field.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Card 2: Account Owner Info */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
                <User size={16} className="text-indigo-600" />
                <h3 className="font-extrabold text-sm text-[var(--foreground)]">Account Owner</h3>
              </div>
              {ownerField && ownerField.value !== "—" ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                    {getInitials(ownerField.value)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-blue-950 truncate">{ownerField.value}</p>
                    {ownerLocationField && ownerLocationField.value !== "—" ? (
                      <p className="text-xs text-blue-700 flex items-center gap-1 font-medium">
                        <MapPin size={12} />
                        {ownerLocationField.value}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <dl className="space-y-3.5">
                {ownerFields.map((field) => (
                  <div key={field.label} className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      {field.label}
                    </dt>
                    <dd className="mt-0.5">
                      <FieldValue label={field.label} value={field.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Card 3: Performance & Activity Standing */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
                <Activity size={16} className="text-amber-500" />
                <h3 className="font-extrabold text-sm text-[var(--foreground)]">Standing & Performance</h3>
              </div>
              <dl className="space-y-3.5">
                {metricFields.map((field) => (
                  <div key={field.label} className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      {field.label}
                    </dt>
                    <dd className="mt-0.5">
                      <FieldValue label={field.label} value={field.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Accordion>

        <Accordion title="Events" icon={Calendar} count={detail.events.length}>
          <Groups groups={detail.events} />
        </Accordion>

        <Accordion title="People and Relationships" icon={User} count={detail.people.length}>
          <Groups groups={detail.people} />
        </Accordion>

        <Accordion title="Operational Activity" icon={Activity} count={detail.activity.length}>
          <Groups groups={detail.activity} />
        </Accordion>

        <Accordion title="Finance and Reputation" icon={DollarSign} count={detail.finance.length}>
          <Groups groups={detail.finance} />
        </Accordion>
      </div>
    </DashboardShell>
  );
}

