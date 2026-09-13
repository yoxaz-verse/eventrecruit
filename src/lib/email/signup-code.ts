import { atAuthEmailStage } from "./failure";
import { assertEmailOtp } from "./message";

type SignupLinkResult = {
  data: { properties?: { email_otp?: string } | null } | null;
  error: (Error & { code?: string }) | null;
};

export async function sendSignupCode(
  generateSignupLink: () => Promise<SignupLinkResult>,
  sendNewAccountCode: (code: string) => Promise<void>,
  sendExistingAccountCode: () => Promise<void>,
): Promise<"signup" | "activation"> {
  const { data, error } = await atAuthEmailStage("supabase_generate", generateSignupLink);

  if (error?.code === "email_exists") {
    await atAuthEmailStage("smtp_delivery", sendExistingAccountCode);
    return "activation";
  }
  if (error) await atAuthEmailStage("supabase_generate", () => { throw error; });

  const code = await atAuthEmailStage("otp_validate", () => assertEmailOtp(data?.properties?.email_otp));

  await atAuthEmailStage("smtp_delivery", () => sendNewAccountCode(code));
  return "signup";
}
