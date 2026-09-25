export type AccountSettingsAvailability = "ready" | "migration_required" | "temporarily_unavailable";

export function accountSettingsAvailability(errors: Array<{ code?: string | null } | null | undefined>): AccountSettingsAvailability {
  const failures = errors.filter(Boolean);
  if (!failures.length) return "ready";
  return failures.some(error => ["PGRST205", "42P01", "42703"].includes(error?.code ?? "")) ? "migration_required" : "temporarily_unavailable";
}

