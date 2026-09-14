import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { SiteFooter } from "@/components/site-footer";
import { RoleCard } from "@/components/role-card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/auth";
import type { EventRole } from "@/lib/types";
import { Search, MapPin, Sparkles, Filter, Lock } from "lucide-react";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: Promise<{ city?: string; q?: string }>;
}) {
  const { city = "", q = "" } = (await searchParams) ?? {};
  const db = await createClient();
  const user = await getCurrentAccount();
  const [result, profileResult] = user
    ? await Promise.all([db!.from("staffing_roles")
        .select("id,title,description,headcount,hourly_rate,shift_start,shift_end,work_starts_on,work_ends_on,required_skills,status,events(title,venue,city,starts_at)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(100), db!.from("profiles").select("role,verification_status").eq("id", user.id).maybeSingle()])
    : [null, null];
  const mayApply = profileResult?.data?.role === "talent" && profileResult.data.verification_status === "verified";
  const roles: EventRole[] = (result?.data ?? []).flatMap((record) => {
    const event = Array.isArray(record.events) ? record.events[0] : record.events;
    if (!event) return [];
    return [{
      id: record.id,
      eventTitle: event.title,
      location: `${event.venue}, ${event.city}`,
      date: `${record.work_starts_on} – ${record.work_ends_on}`,
      shift: `${record.shift_start} – ${record.shift_end}`,
      role: record.title,
      description: record.description ?? undefined,
      headcount: record.headcount,
      rate: Number(record.hourly_rate),
      skills: record.required_skills ?? [],
      status: "open" as const,
    }];
  });
  const cities = [...new Set(roles.map((role) => role.location.split(", ").at(-1) ?? ""))].filter(Boolean).sort();
  const filtered = roles.filter((role) =>
    (!city || role.location.endsWith(`, ${city}`)) &&
    (!q || `${role.role} ${role.eventTitle}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <div className="shell public-page min-h-screen">
      <TopNav />
      <main className="page py-10">
        <div className="page-kicker">
          <span className="badge badge-accent inline-flex items-center gap-1.5">
            <Sparkles size={14} aria-hidden />
            <span>India opportunities</span>
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Open event & retail roles</h1>
          <p className="mt-2 text-lg text-[var(--muted)]">Browse current staffing needs across exhibitions, launches, and activations.</p>
        </div>

        {user && !result?.error && !profileResult?.error ? (
          <>
            <form className="panel filter-panel my-8 grid gap-4 p-6 shadow-md md:grid-cols-[1fr_220px_auto]" action="/browse">
              <label className="label">
                <span>Role or event title</span>
                <div className="relative">
                  <input className="input pl-10" name="q" placeholder="e.g. Promoter, Host, Demo..." defaultValue={q} maxLength={160} />
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
                </div>
              </label>
              <label className="label">
                <span>City location</span>
                <div className="relative">
                  <select className="input pl-10" name="city" defaultValue={city}>
                    <option value="">All cities</option>
                    {cities.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" aria-hidden />
                </div>
              </label>
              <button className="button button-primary self-end gap-2 px-6" type="submit">
                <Filter size={17} aria-hidden />
                <span>Filter</span>
              </button>
            </form>

            {!mayApply && (
              <div className="callout-banner callout-banner-amber my-6">
                <div className="flex items-start gap-3">
                  <div className="callout-icon">
                    <Lock size={20} aria-hidden />
                  </div>
                  <div className="callout-content">
                    <h4 className="callout-title">Verification required for applications</h4>
                    <p className="callout-desc">
                      You are viewing open roles. Applying to work positions requires a verified talent profile.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between my-4">
              <p className="text-sm font-bold text-[var(--muted)]">Showing {filtered.length} open position{filtered.length === 1 ? "" : "s"}</p>
            </div>

            <div className="grid-auto gap-6">{filtered.map((role) => <RoleCard apply={mayApply} key={role.id} role={role} rateUnit="hour" showDate />)}</div>

            {!filtered.length && (
              <div className="panel p-10 text-center my-8">
                <Search size={32} className="mx-auto text-[var(--muted)] mb-3" aria-hidden />
                <h3 className="text-xl font-bold">No open roles found</h3>
                <p className="text-sm text-[var(--muted)] mt-1">Try adjusting your keyword search or city filter.</p>
              </div>
            )}
          </>
        ) : user ? (
          <p role="alert" className="panel mt-6 p-6">Roles are temporarily unavailable. Please try again.</p>
        ) : (
          <div className="callout-banner callout-banner-emerald my-8">
            <div className="flex items-start gap-3">
              <div className="callout-icon">
                <Lock size={22} aria-hidden />
              </div>
              <div className="callout-content">
                <h4 className="callout-title">Sign in to view and apply for open positions</h4>
                <p className="callout-desc">
                  Sign in with your account or create a free talent profile to view live openings across India.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link className="callout-btn" href="/login">Log in</Link>
              <Link className="button button-primary text-xs" href="/signup">Sign up</Link>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
