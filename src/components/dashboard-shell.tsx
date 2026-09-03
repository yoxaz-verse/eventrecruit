import Link from "next/link";
import { BriefcaseBusiness, Building2, Sparkles, ShieldCheck, Users } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { UserRole } from "@/lib/types";

const nav = [
  { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck },
  { href: "/dashboard/agency", label: "Agency", icon: Users },
  { href: "/dashboard/exhibitor", label: "Exhibitor", icon: Building2 },
  { href: "/dashboard/talent", label: "Event Talent", icon: Sparkles },
];

export function DashboardShell({
  active,
  children,
}: {
  active: UserRole;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[250px_1fr]">
      <aside className="border-r border-[var(--line)] bg-[var(--panel)] p-5">
        <Link className="mb-8 flex items-center gap-2 font-black" href="/">
          <BriefcaseBusiness size={24} aria-hidden />
          EventRecruit
        </Link>
        <nav className="grid gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = item.href.endsWith(active);
            return (
              <Link
                key={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 font-bold ${
                  isActive ? "bg-teal-700 text-white" : "text-[var(--muted)] hover:bg-white"
                }`}
                href={item.href}
              >
                <Icon size={18} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={signOut} className="mt-8">
          <button className="button button-secondary w-full" type="submit">
            Sign out
          </button>
        </form>
      </aside>
      <main className="p-5 md:p-8">{children}</main>
    </div>
  );
}
