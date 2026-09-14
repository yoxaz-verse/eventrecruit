export type AuthEmailStage = "configuration" | "smtp_delivery" | "unexpected" | "account_lookup" | "otp_generate" | "otp_store" | "otp_verify";

export class AuthEmailStageError extends Error {
  constructor(public readonly stage: AuthEmailStage, public readonly category: string) {
    super(`Authentication email failed at ${stage}.`);
    this.name = "AuthEmailStageError";
  }
}

export function authEmailDiagnostic(error: AuthEmailStageError) {
  return { stage: error.stage, category: error.category };
}

export function classifyAuthEmailFailure(stage: AuthEmailStage, error: unknown): AuthEmailStageError {
  if (error instanceof AuthEmailStageError) return error;
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  if (stage === "configuration") return new AuthEmailStageError(stage, "app_url_invalid");
  if (stage === "unexpected") return new AuthEmailStageError(stage, "unexpected_error");
  if (stage === "otp_generate") return new AuthEmailStageError(stage, "otp_generation_failed");
  if (stage === "account_lookup") return new AuthEmailStageError(stage, "database_error");
  if (stage === "otp_store" || stage === "otp_verify") return new AuthEmailStageError(stage, "database_error");
  return new AuthEmailStageError(stage, code === "OTP_INVALID_FORMAT" ? "otp_invalid_format" : "mxroute_api_unexpected");
}

export async function atAuthEmailStage<T>(stage: AuthEmailStage, task: () => Promise<T> | T): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (error instanceof AuthEmailStageError) throw error;
    throw classifyAuthEmailFailure(stage, error);
  }
}
