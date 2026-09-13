type SignupLinkResult = {
  data: { properties?: { email_otp?: string } | null } | null;
  error: (Error & { code?: string }) | null;
};

export async function sendSignupCode(
  generateSignupLink: () => Promise<SignupLinkResult>,
  sendNewAccountCode: (code: string) => Promise<void>,
  sendExistingAccountCode: () => Promise<void>,
): Promise<"signup" | "activation"> {
  const { data, error } = await generateSignupLink();

  if (error?.code === "email_exists") {
    await sendExistingAccountCode();
    return "activation";
  }
  if (error) throw error;

  const code = data?.properties?.email_otp;
  if (!code) {
    throw Object.assign(new Error("Supabase did not return an OTP."), { code: "SUPABASE_OTP_MISSING" });
  }

  await sendNewAccountCode(code);
  return "signup";
}
