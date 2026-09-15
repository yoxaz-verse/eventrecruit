import Link from "next/link";
import { LayoutDashboard, LogIn, UserPlus, Calendar, Search, LogOut } from "lucide-react";
import { getCurrentAccount } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { PublicMobileNavigation } from "@/components/public-mobile-navigation";

export async function TopNav({ signedIn: signedInOverride }: { signedIn?: boolean } = {}) {
  const signedIn = signedInOverride ?? Boolean(await getCurrentAccount());
  return (
    <>
      <PublicMobileNavigation signedIn={signedIn} />
      <header className="site-header sticky top-0 z-50 hidden border-b border-[var(--line)]/70 bg-white/85 backdrop-blur-md transition-all md:block">
      <div className="page flex min-h-20 flex-nowrap items-center justify-between gap-4 py-0">
        <Link aria-label="exporb home" className="brand-link group" href="/">
          <span className="brand-mark shadow-sm transition-transform group-hover:scale-105" aria-hidden="true">
            <span className="brand-orbit brand-orbit-one" />
            <span className="brand-orbit brand-orbit-two" />
            <span className="brand-core" />
          </span>
          <span className="brand-wordmark font-black tracking-tight">
            expo<span className="text-[var(--accent)]">rb</span>
          </span>
        </Link>

        <nav className="flex min-w-0 flex-nowrap items-center justify-end gap-1 lg:gap-2.5">
          <Link className="button button-secondary text-xs sm:text-sm font-semibold gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 border-transparent hover:border-[var(--line)]" href="/events">
            <Calendar size={16} className="text-[var(--accent)]" aria-hidden />
            <span>Events</span>
          </Link>
          <Link className="button button-secondary text-xs sm:text-sm font-semibold gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 border-transparent hover:border-[var(--line)]" href="/browse">
            <Search size={16} className="text-[var(--accent)]" aria-hidden />
            <span>Browse roles</span>
          </Link>
          
          <div className="h-5 w-px bg-[var(--line)] mx-1 hidden sm:block" />

          {signedIn ? (
            <>
              <Link className="button button-primary text-sm font-bold gap-2 shadow-md hover:shadow-lg" href="/dashboard">
                <LayoutDashboard size={17} aria-hidden />
                <span>Dashboard</span>
              </Link>
              <form action={signOut}>
                <button className="button button-secondary text-sm font-semibold gap-1.5" type="submit">
                  <LogOut size={16} aria-hidden />
                  <span>Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="button button-secondary text-sm font-bold gap-2" href="/login">
                <LogIn size={17} aria-hidden />
                <span>Log in</span>
              </Link>
              <Link className="button button-primary text-sm font-bold gap-2 shadow-md hover:shadow-lg" href="/signup">
                <UserPlus size={17} aria-hidden />
                <span>Sign up</span>
              </Link>
            </>
          )}
        </nav>
      </div>
      </header>
    </>
  );
}
