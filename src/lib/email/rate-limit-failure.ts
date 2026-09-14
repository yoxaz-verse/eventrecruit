import { AuthEmailStageError } from "./failure";

type ProviderFailure = { code?: unknown; status?: unknown };

export function classifyRateLimitFailure(error: unknown): AuthEmailStageError {
  if (error instanceof AuthEmailStageError) return error;
  const failure = error && typeof error === "object" ? error as ProviderFailure : {};
  const code = typeof failure.code === "string" ? failure.code : "";
  const status = typeof failure.status === "number" ? failure.status : 0;

  if (code === "PGRST202" || code === "42883" || code === "PGRST205" || code === "42P01") {
    return new AuthEmailStageError("rate_limit", "migration_missing");
  }
  if (status === 401 || status === 403 || code === "42501" || code === "PGRST301") {
    return new AuthEmailStageError("rate_limit", "database_auth_rejected");
  }
  if (code === "AUTH_EMAIL_RATE_LIMIT_UNAVAILABLE") {
    return new AuthEmailStageError("rate_limit", "invalid_database_response");
  }
  if (status === 0 && !code) {
    return new AuthEmailStageError("rate_limit", "database_connection_failed");
  }
  return new AuthEmailStageError("rate_limit", "database_error");
}
