import { AuthTopTabs } from "@/components/auth/auth-top-tabs";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Building2, Check, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";

export function AuthCard({
  badge,
  title,
  description,
  children,
  footer,
  showTabs = true,
}: {
  badge: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: { text: string; href: string; label: string };
  showTabs?: boolean;
}) {
  const isSignup = footer?.href === "/login";

  return (
    <main className="auth-band py-6 px-4 sm:px-6 min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-[0.9fr_1.1fr] items-stretch my-auto">
        
        {/* Left Side: Brand & Social Proof Showcase */}
        <div className="hidden lg:flex min-h-[680px] flex-col p-7 rounded-3xl bg-[#0b1224] text-white shadow-xl relative overflow-hidden isolate">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_85%_12%,rgba(59,130,246,0.28),transparent_34%),radial-gradient(circle_at_10%_82%,rgba(245,158,11,0.14),transparent_32%),linear-gradient(145deg,#0b1224_0%,#111d36_56%,#173c86_100%)]" />
          <div className="absolute inset-0 -z-10 opacity-25 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
          <div className="absolute -right-24 top-48 -z-10 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-62 -z-10 h-56 w-56 rounded-full border border-white/10" />

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] backdrop-blur-md border border-white/12 text-amber-200">
              <Sparkles size={13} aria-hidden />
              <span>India-wide event operations</span>
            </div>

            <h2 className="mt-5 max-w-sm text-[2.15rem] font-black tracking-[-0.045em] leading-[1.03]">
              Build the crew.<br />
              <span className="text-blue-300">Run the moment.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm text-slate-300 leading-relaxed">
              One workspace to discover verified talent, fill every role, and keep event operations moving.
            </p>
          </div>

          <div className="relative my-8 rounded-[1.4rem] border border-white/12 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200/70">Live staffing board</p>
                <p className="mt-1 text-sm font-extrabold">Retail launch · Mumbai</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/12 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> On track
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { value: "24", label: "Crew needed" },
                { value: "19", label: "Confirmed" },
                { value: "5", label: "Open roles" },
              ].map((metric) => (
                <div className="rounded-xl border border-white/8 bg-slate-950/25 p-2.5" key={metric.label}>
                  <strong className="block text-lg font-black tracking-tight">{metric.value}</strong>
                  <span className="mt-0.5 block text-[9px] leading-tight text-slate-400">{metric.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {[
                { icon: Users, role: "Brand promoters", filled: "8 / 8", complete: true },
                { icon: BriefcaseBusiness, role: "Registration crew", filled: "6 / 8", complete: false },
                { icon: Building2, role: "Floor coordinators", filled: "5 / 8", complete: false },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3 py-2" key={row.role}>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-400/12 text-blue-200"><Icon size={14} aria-hidden /></span>
                    <span className="min-w-0 flex-1 text-[11px] font-semibold text-slate-200">{row.role}</span>
                    <span className={row.complete ? "text-[10px] font-bold text-emerald-300" : "text-[10px] font-bold text-amber-200"}>{row.filled}</span>
                    {row.complete ? <Check size={13} className="text-emerald-300" aria-hidden /> : <ArrowUpRight size={13} className="text-amber-200" aria-hidden />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto grid gap-2.5">
            {[
              { icon: ShieldCheck, title: "Verified profiles", desc: "Identity, skills and work history" },
              { icon: MapPin, title: "10+ active cities", desc: "Talent where your events happen" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm" key={item.title}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
                    <Icon size={16} aria-hidden />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-white">{item.title}</strong>
                    <p className="mt-0.5 text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/12 pt-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            <span>1,240+ talent members</span>
            <span>400+ placements</span>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <section className="panel auth-card p-5 sm:p-7 rounded-3xl bg-white shadow-xl border border-[var(--line)] flex flex-col justify-between">
          <div>
            {/* Top Tab Switcher with Instant Optimistic State */}
            {showTabs ? <AuthTopTabs currentHref={isSignup ? "/signup" : "/login"} /> : null}

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


