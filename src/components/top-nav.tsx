import Link from "next/link";
import { CalendarDays, LayoutDashboard, LogIn, UserPlus } from "lucide-react";

export function TopNav() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--panel)]">
      <div className="page flex min-h-16 flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap sm:py-0">
        <Link className="flex items-center gap-2 font-black" href="/">
          <CalendarDays size={24} aria-hidden />
          EventRecruit
        </Link>
        <nav className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          <Link className="button button-secondary" href="/browse">
            Browse roles
          </Link>
          <Link className="button button-secondary" href="/login" aria-label="Log in">
            <LogIn size={18} aria-hidden />
          </Link>
          <Link className="button button-primary" href="/signup">
            <UserPlus size={18} aria-hidden />
            Sign up
          </Link>
          <Link className="button button-secondary" href="/dashboard" aria-label="Dashboard">
            <LayoutDashboard size={18} aria-hidden />
          </Link>
        </nav>
      </div>
    </header>
  );
}
