import Link from "next/link";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--ink)] text-white">
      <div className="page py-12 pb-24 md:pb-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link aria-label="exporb home" className="brand-link inline-flex items-center gap-3" href="/">
              <span className="brand-mark shadow-sm" aria-hidden="true">
                <span className="brand-orbit brand-orbit-one" />
                <span className="brand-orbit brand-orbit-two" />
                <span className="brand-core" />
              </span>
              <span className="brand-wordmark font-black tracking-tight text-white">
                expo<span className="text-[var(--accent-2)]">rb</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-xs text-slate-300/80 leading-relaxed">
              India-wide event and retail staffing operations platform. Coordinate verified talent for exhibitions, retail stores, roadshows, pop-ups, and campaign activations.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-200">Platform</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-300/90">
              <li>
                <Link className="hover:text-white transition-colors" href="/events">
                  Public Events
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/browse">
                  Browse Open Roles
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/login">
                  Sign In
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/signup">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-200">Accounts & Roles</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-300/90">
              <li>
                <Link className="hover:text-white transition-colors" href="/signup?role=talent">
                  Event Talent
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/signup?role=exhibitor">
                  Exhibitors & Brands
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/signup?role=organizer">
                  Event Organizers
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/signup?role=agency">
                  Staffing Agencies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {currentYear} exporb. All rights reserved to Yoxaz Verse.</p>
          <div className="flex items-center gap-1">
            <Sparkles size={13} className="text-amber-300" aria-hidden />
            <span>A product of</span>
            <span className="font-bold text-white">Yoxaz Verse</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
