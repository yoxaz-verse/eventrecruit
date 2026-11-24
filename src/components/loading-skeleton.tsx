export function LoadingSkeleton({ label = "Loading content" }: { label?: string }) {
  return (
    <div className="w-full animate-pulse" role="status" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="h-7 w-48 rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-32 rounded-2xl border border-[var(--line)] bg-white" key={index} />
        ))}
      </div>
    </div>
  );
}
