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
        <div className="page-kicker flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="badge badge-accent">India opportunities</span>
            <h1>Open event and retail roles</h1>
            <p>
              Verified talent can apply for live recruitment needs from exhibitors,
              agencies, brands, and store activation teams across India.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="input w-[180px]" aria-label="Filter by location">
              <option>All locations</option>
              <option>Delhi NCR</option>
              <option>Mumbai</option>
              <option>Bengaluru</option>
              <option>Hyderabad</option>
              <option>Chennai</option>
              <option>Kochi</option>
            </select>
            <select className="input w-[160px]" aria-label="Filter by role">
              <option>All roles</option>
              <option>Host</option>
              <option>Demo staff</option>
              <option>Retail promoter</option>
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
