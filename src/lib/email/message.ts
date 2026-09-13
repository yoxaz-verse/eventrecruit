export type AuthEmailPurpose = "signup" | "login" | "activation" | "recovery";

const content: Record<AuthEmailPurpose, { heading: string; subject: string }> = {
  signup: {
    heading: "Verify your email address",
    subject: "Verify your EventRecruit account",
  },
  login: {
    heading: "Your sign-in code",
    subject: "Sign in to EventRecruit",
  },
  activation: {
    heading: "Activate your account",
    subject: "Activate your EventRecruit account",
  },
  recovery: {
    heading: "Reset your password",
    subject: "Reset your EventRecruit password",
  },
};

export function buildAuthEmail(code: string, purpose: AuthEmailPurpose) {
  if (!/^\d{6}$/.test(code)) {
    throw new Error("Supabase returned an invalid email OTP.");
  }

  const copy = content[purpose];
  const guidance = "Use the latest code you requested. It expires according to your account security settings.";

  return {
    subject: copy.subject,
    text: `EventRecruit\n\n${copy.heading}\n\nYour verification code is: ${code}\n\n${guidance}\n\nIf you did not request this email, you can ignore it. Never share this code.`,
    html: `<!doctype html><html><body style="margin:0;background:#f4f7f5;color:#192622;font-family:Arial,sans-serif"><div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #d9e2de;border-radius:14px;padding:32px"><p style="margin:0 0 24px;color:#08796c;font-size:20px;font-weight:700">EventRecruit</p><h1 style="margin:0 0 18px;font-size:28px">${copy.heading}</h1><p style="margin:0 0 10px">Your verification code is:</p><p style="margin:0 0 24px;color:#08796c;font-size:34px;font-weight:700;letter-spacing:8px">${code}</p><p style="color:#52635d;line-height:1.55">${guidance}</p><p style="color:#52635d;line-height:1.55">If you did not request this email, you can ignore it. Never share this code.</p></div></body></html>`,
  };
}
