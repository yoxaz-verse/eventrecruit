import Link from "next/link";

export default function NotFound() {
  return <main className="page flex min-h-screen items-center justify-center py-12"><section className="panel max-w-xl p-8 text-center"><span className="badge">404</span><h1 className="mt-4 text-4xl font-black">Page not found</h1><p className="mt-3 text-[var(--muted)]">The page may have moved, expired, or never existed.</p><div className="mt-6 flex justify-center gap-3"><Link className="button button-primary" href="/">Go home</Link><Link className="button button-secondary" href="/events">Browse events</Link></div></section></main>;
}
