import Link from "next/link";
import { ShieldCheck } from "lucide-react";

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
  return (
    <main className="auth-band">
      <section className="panel auth-card">
        <div>
          <span className="badge badge-accent">
            <ShieldCheck size={14} aria-hidden />
            {badge}
          </span>
          <h1 className="mt-4 text-3xl font-black">{title}</h1>
          <p className="mt-2 text-[var(--muted)]">{description}</p>
        </div>
        {children}
        {footer ? (
          <p className="text-sm text-[var(--muted)]">
            {footer.text}{" "}
            <Link className="font-bold text-[var(--accent)]" href={footer.href}>
              {footer.label}
            </Link>
          </p>
        ) : null}
      </section>
    </main>
  );
}
