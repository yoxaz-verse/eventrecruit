import Link from "next/link";
import { LayoutDashboard, LogIn, Calendar, Search, ArrowUpRight } from "lucide-react";
import { PublicMobileNavigation } from "@/components/public-mobile-navigation";
import { BrandMark } from "@/components/brand-mark";

export function TopNav() {
  return (
    <>
      <PublicMobileNavigation />
      <header className="site-header sticky top-0 z-50 hidden border-b border-[var(--line)]/70 bg-white/85 backdrop-blur-md transition-all md:block">
      <div className="page flex min-h-20 flex-nowrap items-center justify-between gap-4 py-0">
        <Link aria-label="exporb home" className="brand-link group" href="/">
          <BrandMark className="shadow-sm transition-transform group-hover:scale-105" />
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

          <Link className="button button-secondary text-sm font-bold gap-2" href="/login">
            <LogIn size={17} aria-hidden />
            <span>Log in</span>
          </Link>
          <Link className="button button-primary text-sm font-bold gap-2 shadow-md hover:shadow-lg" href="/dashboard">
            <LayoutDashboard size={17} aria-hidden />
            <span>Find talent</span>
            <ArrowUpRight size={15} aria-hidden />
          </Link>
        </nav>
      </div>
      </header>
    </>
  );
}
