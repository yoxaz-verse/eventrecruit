import Link from "next/link";
import { CalendarDays, LayoutDashboard, LogIn, UserPlus } from "lucide-react";

export function TopNav() {
  return (
    <header className="site-header border-b border-[var(--line)]">
      <div className="page flex min-h-16 flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap sm:py-0">
        <Link className="brand-link" href="/">
          <span className="brand-mark">
            <CalendarDays size={20} aria-hidden />
          </span>
          <span>EventRecruit</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          <Link className="button button-secondary" href="/events">Events</Link>
          <Link className="button button-secondary" href="/signup?role=organizer">Event Organizer</Link>
          <Link className="button button-secondary hide-sm" href="/browse">
            Browse roles
          </Link>
          <Link className="button button-secondary nav-icon-button" href="/login" aria-label="Log in">
            <LogIn size={18} aria-hidden />
          </Link>
          <Link className="button button-primary" href="/signup">
            <UserPlus size={18} aria-hidden />
            Sign up
          </Link>
          <Link className="button button-secondary nav-icon-button" href="/dashboard" aria-label="Dashboard">
            <LayoutDashboard size={18} aria-hidden />
          </Link>
        </nav>
      </div>
    </header>
  );
}
