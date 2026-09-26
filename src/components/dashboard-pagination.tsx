import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { paginationHref } from "@/lib/pagination";

export function DashboardPagination({
  path,
  page,
  hasNext,
  params = {},
}: {
  path: string;
  page: number;
  hasNext: boolean;
  params?: Record<string, string | string[] | undefined>;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
      {page > 1 ? <Link className="button button-secondary gap-1.5" href={paginationHref(path, params, page - 1)}><ChevronLeft size={16} />Previous</Link> : <span />}
      <span className="text-xs font-bold text-[var(--muted)]">Page {page.toLocaleString("en-IN")}</span>
      {hasNext ? <Link className="button button-secondary gap-1.5" href={paginationHref(path, params, page + 1)}>Next<ChevronRight size={16} /></Link> : <span />}
    </nav>
  );
}
