export type ExistingEmailPurpose = "activation" | "login" | "recovery";

export function existingEmailError(
  purpose: ExistingEmailPurpose,
  account: { email_verified_at: string | null } | null,
): string | null {
  if (!account) return "This email is not registered. Create an account to continue.";
  if (purpose === "activation") {
    return account.email_verified_at ? "This account is already verified. Log in instead." : null;
  }
  return account.email_verified_at
    ? null
    : "This account is not verified yet. Complete signup verification first.";
}
