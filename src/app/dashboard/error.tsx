"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="page py-12" role="alert">
      <h1 className="text-3xl font-bold">Unable to load the dashboard</h1>
      <p className="my-4">Please try again. If this continues, contact support.</p>
      <button className="button button-primary" onClick={reset}>Try again</button>
    </main>
  );
}
