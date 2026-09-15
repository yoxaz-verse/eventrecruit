export default function BrowseLoading() {
  return (
    <main className="page py-10" aria-busy="true" aria-label="Loading open roles">
      <div className="h-8 w-40 animate-pulse rounded-full bg-[var(--line)]" />
      <div className="mt-4 h-12 max-w-xl animate-pulse rounded-xl bg-[var(--line)]" />
      <div className="mt-8 h-32 animate-pulse rounded-2xl bg-[var(--line)]" />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="panel h-80 animate-pulse" key={item} />
        ))}
      </div>
    </main>
  );
}
