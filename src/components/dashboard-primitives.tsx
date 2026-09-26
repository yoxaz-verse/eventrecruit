import Link from "next/link";
import type { ElementType, ReactNode } from "react";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={classes("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="mb-3">{typeof eyebrow === "string" ? <span className="badge badge-accent">{eyebrow}</span> : eyebrow}</div> : null}
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-[var(--muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  as: Component = "section",
  children,
  className,
  density = "comfortable",
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  density?: "compact" | "comfortable" | "spacious";
}) {
  const padding = density === "compact" ? "p-4" : density === "spacious" ? "p-6 sm:p-8" : "p-5 sm:p-6";
  return <Component className={classes("panel rounded-2xl border border-[var(--line)] bg-white shadow-xs", padding, className)}>{children}</Component>;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  href,
  iconClassName = "bg-blue-50 text-[var(--accent)]",
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ElementType;
  href?: string;
  iconClassName?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        {Icon ? <span className={classes("flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110", iconClassName)}><Icon size={20} aria-hidden /></span> : null}
      </div>
      <strong className="mt-3 block text-3xl font-black text-[var(--foreground)]">{value}</strong>
    </>
  );
  const className = "panel group min-h-32 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md";
  return href ? <Link className={className} href={href}>{content}</Link> : <article className={className}>{content}</article>;
}

export function EntityMeta({
  icon: Icon,
  children,
  className,
}: {
  icon?: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return <span className={classes("inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]", className)}>{Icon ? <Icon size={14} className="shrink-0 text-[var(--accent)]" aria-hidden /> : null}{children}</span>;
}

export function DashboardList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classes("grid gap-4", className)}>{children}</div>;
}
