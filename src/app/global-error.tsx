"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="page flex min-h-screen items-center justify-center py-12">
          <section className="panel max-w-xl p-8 text-center" role="alert">
            <p className="badge">Something went wrong</p>
            <h1 className="mt-4 text-3xl font-black">We could not load this page</h1>
            <p className="mt-3 text-[var(--muted)]">Your information is safe. Try the request again, or return later if the service is unavailable.</p>
            <button className="button button-primary mt-6" onClick={reset}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
