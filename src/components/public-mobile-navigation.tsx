"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, CalendarDays, Home, LayoutDashboard, LogIn } from "lucide-react";
import { isNavigationItemActive } from "@/lib/navigation";

const pageLabels: Array<[string, string]> = [
  ["/forgot-password", "Recover account"],
  ["/reset-password", "Reset password"],
  ["/verify-otp", "Verify account"],
  ["/signup", "Create account"],
  ["/login", "Welcome back"],
  ["/browse", "Open roles"],
  ["/events", "Events"],
  ["/", "Discover"],
];

export function PublicMobileNavigation({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const accountHref = signedIn ? "/dashboard" : "/login";
  const accountLabel = signedIn ? "Portal" : "Account";
  const pageLabel = pageLabels.find(([path]) => isNavigationItemActive(pathname, path))?.[1] ?? "exporb";
  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/events", label: "Events", icon: CalendarDays },
    { href: "/browse", label: "Roles", icon: Briefcase },
    { href: accountHref, label: accountLabel, icon: signedIn ? LayoutDashboard : LogIn },
  ];

  return (
    <>
      <div className="mobile-top-bar md:hidden">
        <div className="page mobile-top-bar-inner">
          <Link aria-label="exporb home" className="brand-link" href="/">
            <span className="brand-mark mobile-brand-mark" aria-hidden="true">
              <span className="brand-orbit brand-orbit-one" />
              <span className="brand-orbit brand-orbit-two" />
              <span className="brand-core" />
            </span>
            <span className="brand-wordmark mobile-wordmark">expo<span>rb</span></span>
          </Link>
          <span className="mobile-page-context" aria-current="page">{pageLabel}</span>
          <Link className="mobile-account-shortcut" href={accountHref} aria-label={signedIn ? "Open your portal" : "Log in to your account"}>
            {signedIn ? <LayoutDashboard size={19} aria-hidden /> : <LogIn size={19} aria-hidden />}
          </Link>
        </div>
      </div>

      <nav className="mobile-tab-bar md:hidden" aria-label="Primary mobile navigation">
        <div className="mobile-tab-list">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = href === "/"
              ? pathname === "/"
              : isNavigationItemActive(pathname, href) || (href === "/login" && ["/signup", "/forgot-password", "/reset-password", "/verify-otp"].some((path) => isNavigationItemActive(pathname, path)));
            return (
              <Link className={`mobile-tab ${active ? "mobile-tab-active" : ""}`} href={href} key={label} aria-current={active ? "page" : undefined}>
                <Icon size={21} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
