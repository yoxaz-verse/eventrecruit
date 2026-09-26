export function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function indexBy<T, K extends string | number>(rows: readonly T[], key: (row: T) => K) {
  return new Map(rows.map((row) => [key(row), row]));
}

type StaffingRoleOf<E> = E extends { staffing_roles?: readonly (infer R)[] | null } ? R : never;

export function flattenStaffingRoles<E extends { staffing_roles?: readonly object[] | null }>(events: readonly E[]): Array<StaffingRoleOf<E> & { event: E }> {
  return events.flatMap((event) => (event.staffing_roles ?? []).map((role) => ({ ...role, event }))) as Array<StaffingRoleOf<E> & { event: E }>;
}

export function countStatuses<T extends { status: string }>(rows: readonly T[], statuses: readonly string[]) {
  const accepted = new Set(statuses);
  return rows.reduce((count, row) => count + Number(accepted.has(row.status)), 0);
}
