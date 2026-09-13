export type AuthEmailStage = "supabase_generate" | "otp_validate" | "smtp_delivery";

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
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  if (stage === "otp_validate") {
    return new AuthEmailStageError(stage, code === "SUPABASE_OTP_MISSING" ? "otp_missing" : "otp_invalid_format");
  }
  if (stage === "supabase_generate") return new AuthEmailStageError(stage, "supabase_error");
  const categories: Record<string, string> = {
    EAUTH: "smtp_auth",
    ETIMEDOUT: "smtp_timeout",
    ECONNECTION: "smtp_connection",
    ECONNREFUSED: "smtp_connection",
    ENOTFOUND: "smtp_connection",
    SMTP_CONFIGURATION: "smtp_configuration",
    SMTP_RECIPIENT_NOT_ACCEPTED: "smtp_recipient_rejected",
  };
  return new AuthEmailStageError(stage, typeof code === "string" ? categories[code] ?? "smtp_error" : "smtp_error");
}

export async function atAuthEmailStage<T>(stage: AuthEmailStage, task: () => Promise<T> | T): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (error instanceof AuthEmailStageError) throw error;
    throw classifyAuthEmailFailure(stage, error);
  }
}
