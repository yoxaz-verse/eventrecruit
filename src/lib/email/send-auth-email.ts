import "server-only";

import type { AuthEmailPurpose } from "./message";
import { deliverAuthCode } from "./delivery";
import { createAuthTransport } from "./smtp";

export async function sendAuthEmail(email: string, code: string, purpose: AuthEmailPurpose) {
  const { transport, from } = createAuthTransport();
  await deliverAuthCode(transport, from, email, code, purpose);
}
