export const DASHBOARD_PAGE_SIZE = 25;
export const MAX_DASHBOARD_PAGE = 10_000;

export type BoundedPagination = {
  page: number;
  pageSize: number;
  from: number;
  to: number;
};

export function dashboardPagination(value: string | string[] | undefined, pageSize = DASHBOARD_PAGE_SIZE): BoundedPagination {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  const page = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), MAX_DASHBOARD_PAGE) : 1;
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, to: from + pageSize - 1 };
}

export function paginationHref(path: string, params: Record<string, string | string[] | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value == null) continue;
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized) query.set(key, normalized);
  }
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}
