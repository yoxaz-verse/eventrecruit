import Link from "next/link";
import { ShieldCheck, Users, Building2, MapPin, Sparkles } from "lucide-react";

export function AuthCard({
  badge,
  title,
  description,
  children,
  footer,
}: {
  badge: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: { text: string; href: string; label: string };
}) {
  const isSignup = footer?.href === "/login";

  return (
    <main className="auth-band py-6 px-4 sm:px-6 min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-[0.9fr_1.1fr] items-stretch my-auto">
        
        {/* Left Side: Brand & Social Proof Showcase */}
        <div className="hidden lg:flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-br from-[var(--ink)] via-[#15463b] to-[var(--accent)] text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold backdrop-blur-md border border-white/15 text-amber-200">
              <Sparkles size={13} aria-hidden />
              <span>India-Wide Event Ops</span>
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight leading-tight">
              Coordinate verified people for events & stores.
            </h2>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Find hosts, registration crews, promoters, lead capture, and retail teams across 10+ Indian markets.
            </p>
          </div>

          <div className="my-5 grid gap-3">
            {[
              { icon: ShieldCheck, title: "Verified Profiles", desc: "Identity checks, skills & placement history" },
              { icon: MapPin, title: "10+ Active Cities", desc: "Delhi NCR, Mumbai, Bengaluru, Hyderabad" },
              { icon: Building2, title: "End-to-End Workflow", desc: "From application to shift execution" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm" key={item.title}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-amber-300 shrink-0">
                    <Icon size={16} aria-hidden />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-white block">{item.title}</strong>
                    <p className="text-[11px] text-emerald-100/75 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100/70">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-amber-300" aria-hidden />
              1,240+ Talent Members
            </span>
            <span>400+ Placements</span>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <section className="panel auth-card p-5 sm:p-7 rounded-3xl bg-white shadow-xl border border-[var(--line)] flex flex-col justify-between">
          <div>
            {/* Top Tab Switcher */}
            <div className="auth-tabs grid grid-cols-2 p-1 bg-[var(--surface)] rounded-xl mb-4">
              <Link
                href="/login"
                className={`flex items-center justify-center min-h-[38px] text-xs font-bold rounded-lg transition-all ${
                  !isSignup
                    ? "bg-white text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={`flex items-center justify-center min-h-[38px] text-xs font-bold rounded-lg transition-all ${
                  isSignup
                    ? "bg-white text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Create account
              </Link>
            </div>

            <div className="mb-4">
              <span className="badge badge-accent inline-flex items-center gap-1 text-[10px] py-0.5 px-2.5">
                <ShieldCheck size={13} aria-hidden />
                {badge}
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--foreground)]">{title}</h1>
              <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
            </div>

            {children}
          </div>

          {footer ? (
            <div className="mt-5 pt-3 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
              {footer.text}{" "}
              <Link className="font-extrabold text-[var(--accent)] hover:underline" href={footer.href}>
                {footer.label}
              </Link>
            </div>
          ) : null}
        </section>

      </div>
    </main>
  );
}


