import type { AuthEmailPurpose } from "./message";
import { buildAuthEmail } from "./message";

type SendResult = { accepted: Array<string | { address: string }> };
type Sender = { sendMail(message: { from: string; to: string; subject: string; text: string; html: string }): Promise<SendResult> };

export async function deliverAuthCode(
  sender: Sender,
  from: string,
  email: string,
  code: string,
  purpose: AuthEmailPurpose,
) {
  const message = buildAuthEmail(code, purpose);
  const result = await sender.sendMail({ ...message, from, to: email });
  const expected = email.trim().toLowerCase();
  const accepted = result.accepted.some((recipient) =>
    (typeof recipient === "string" ? recipient : recipient.address).trim().toLowerCase() === expected,
  );

  if (!accepted) {
    throw Object.assign(new Error("MXroute did not accept the recipient."), { code: "SMTP_RECIPIENT_NOT_ACCEPTED" });
  }
}
