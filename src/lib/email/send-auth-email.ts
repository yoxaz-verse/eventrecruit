import "server-only";

import type { AuthEmailPurpose } from "./message";
import { sendMxrouteEmail } from "./mxroute-api";

export async function sendAuthEmail(email: string, code: string, purpose: AuthEmailPurpose) {
  await sendMxrouteEmail({
    server: process.env.SMTP_HOST?.trim() ?? "",
    username: process.env.SMTP_AUTH_USER?.trim() ?? "",
    password: process.env.SMTP_AUTH_PASS ?? "",
    from: process.env.SMTP_FROM?.trim() ?? "",
  }, email, code, purpose);
}
