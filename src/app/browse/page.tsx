import { TopNav } from "@/components/top-nav";
import { RoleCard } from "@/components/role-card";
import { openRoles } from "@/lib/mock-data";

export default function BrowsePage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  void searchParams;

  return (
    <div className="shell">
      <TopNav />
      <main className="page py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">Open event roles</h1>
            <p className="mt-2 text-[var(--muted)]">
              Verified event talent can apply for live recruitment needs from exhibitors and agencies.
            </p>
          </div>
          <div className="flex gap-2">
            <select className="input w-[180px]" aria-label="Filter by location">
              <option>All locations</option>
              <option>Dubai</option>
              <option>Bengaluru</option>
              <option>Sharjah</option>
            </select>
            <select className="input w-[160px]" aria-label="Filter by role">
              <option>All roles</option>
              <option>Host</option>
              <option>Demo staff</option>
              <option>Registration</option>
            </select>
          </div>
        </div>
        <div className="grid-auto">
          {openRoles.map((role) => (
            <RoleCard apply key={role.id} role={role} />
          ))}
        </div>
      </main>
    </div>
  );
}
