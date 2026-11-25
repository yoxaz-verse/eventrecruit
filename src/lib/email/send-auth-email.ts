import "server-only";

import type { AuthEmailPurpose } from "./message";
import { mxrouteConfigFromEnv, sendMxrouteEmail } from "./mxroute-smtp";

export async function sendAuthEmail(email: string, code: string, purpose: AuthEmailPurpose) {
  await sendMxrouteEmail(mxrouteConfigFromEnv(), email, code, purpose);
}
