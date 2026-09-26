"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard render failed", { name: error.name, digest: error.digest ?? "unknown" });
  }, [error]);

  return (
    <main className="page py-12" role="alert">
      <h1 className="text-3xl font-bold">Unable to load the dashboard</h1>
      <p className="my-4">Please try again. If this continues, contact support.</p>
      <button className="button button-primary" onClick={reset}>Try again</button>
    </main>
  );
}
