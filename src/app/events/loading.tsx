export default function EventsLoading() {
  return (
    <main className="page py-12" aria-busy="true" aria-label="Loading events">
      <div className="h-8 w-36 animate-pulse rounded-full bg-[var(--line)]" />
      <div className="mt-4 h-12 max-w-md animate-pulse rounded-xl bg-[var(--line)]" />
      <div className="mt-8 h-28 animate-pulse rounded-2xl bg-[var(--line)]" />
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="panel h-72 animate-pulse" key={item} />
        ))}
      </div>
    </main>
  );
}
