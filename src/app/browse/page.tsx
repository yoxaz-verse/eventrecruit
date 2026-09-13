import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { RoleCard } from "@/components/role-card";
import { createClient } from "@/lib/supabase/server";
import type { EventRole } from "@/lib/types";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: Promise<{ city?: string; q?: string }>;
}) {
  const { city = "", q = "" } = (await searchParams) ?? {};
  const db = await createClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const [result, profileResult] = user
    ? await Promise.all([db!.from("staffing_roles")
        .select("id,title,description,headcount,hourly_rate,shift_start,shift_end,required_skills,status,events(title,venue,city,starts_at)")
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
      company: "Event staffing team",
      location: `${event.venue}, ${event.city}`,
      date: event.starts_at,
      shift: `${record.shift_start} – ${record.shift_end}`,
      role: record.title,
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
    <div className="shell">
      <TopNav />
      <main className="page py-10">
        <div className="page-kicker">
          <span className="badge badge-accent">India opportunities</span>
          <h1>Open event and retail roles</h1>
          <p>Browse current staffing needs and apply with your verified talent account.</p>
        </div>
        {user && !result?.error && !profileResult?.error ? (
          <>
            <form className="my-6 flex flex-wrap gap-3" action="/browse">
              <label className="label">Search roles
                <input className="input" name="q" defaultValue={q} maxLength={160} />
              </label>
              <label className="label">City
                <select className="input" name="city" defaultValue={city}>
                  <option value="">All cities</option>
                  {cities.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <button className="button button-primary self-end" type="submit">Filter</button>
            </form>
            {!mayApply && <p className="panel my-6 p-5">Applications require a verified event talent account.</p>}
            <div className="grid-auto">{filtered.map((role) => <RoleCard apply={mayApply} key={role.id} role={role} rateUnit="hour" />)}</div>
            {!filtered.length && <p className="panel p-8">No open roles match your search.</p>}
          </>
        ) : user ? (
          <p role="alert" className="panel mt-6 p-6">Roles are temporarily unavailable. Please try again.</p>
        ) : (
          <p className="panel mt-6 p-6"><Link className="font-bold underline" href="/login">Sign in</Link> to view current openings, or <Link className="font-bold underline" href="/signup">create an account</Link>.</p>
        )}
      </main>
    </div>
  );
}
