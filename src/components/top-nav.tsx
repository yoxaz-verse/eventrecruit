import Link from "next/link";
import { LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { getCurrentAccount } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";

export async function TopNav() {
  const signedIn = Boolean(await getCurrentAccount());
  return (
    <header className="site-header border-b border-[var(--line)]">
      <div className="page flex min-h-20 flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap sm:py-0">
        <Link aria-label="expo sphere home" className="brand-link" href="/">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-orbit brand-orbit-one" />
            <span className="brand-orbit brand-orbit-two" />
            <span className="brand-core" />
          </span>
          <span className="brand-wordmark">expo<span>sphere</span></span>
        </Link>
        <nav className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          <Link className="button button-secondary" href="/events">Events</Link>
          <Link className="button button-secondary hide-sm" href="/browse">
            Browse roles
          </Link>
          {signedIn ? <>
            <Link className="button button-primary" href="/dashboard"><LayoutDashboard size={18} aria-hidden />Dashboard</Link>
            <form action={signOut}><button className="button button-secondary" type="submit">Sign out</button></form>
          </> : <>
            <Link className="button button-secondary" href="/login"><LogIn size={18} aria-hidden />Log in</Link>
            <Link className="button button-primary" href="/signup"><UserPlus size={18} aria-hidden />Sign up</Link>
          </>}
        </nav>
      </div>
    </header>
  );
}
