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
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  if (stage === "configuration") return new AuthEmailStageError(stage, "app_url_invalid");
  if (stage === "unexpected") return new AuthEmailStageError(stage, "unexpected_error");
  if (stage === "otp_generate") return new AuthEmailStageError(stage, "otp_generation_failed");
  if (stage === "account_lookup") return new AuthEmailStageError(stage, "database_error");
  if (stage === "otp_store" || stage === "otp_verify") return new AuthEmailStageError(stage, "database_error");
  const categories: Record<string, string> = {
    EAUTH: "smtp_auth",
    ETIMEDOUT: "smtp_timeout",
    ECONNECTION: "smtp_connection",
    ECONNREFUSED: "smtp_connection",
    ENOTFOUND: "smtp_connection",
    ESOCKET: "smtp_connection",
    EENVELOPE: "smtp_envelope_rejected",
    EMESSAGE: "smtp_message_rejected",
    SMTP_CONFIGURATION: "smtp_configuration",
    SMTP_RECIPIENT_NOT_ACCEPTED: "smtp_recipient_rejected",
  };
  const responseCode = typeof error === "object" && error !== null && "responseCode" in error ? error.responseCode : undefined;
  if (responseCode === 535) return new AuthEmailStageError(stage, "smtp_auth");
  if (responseCode === 550 || responseCode === 553) return new AuthEmailStageError(stage, "smtp_sender_or_recipient_rejected");
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
