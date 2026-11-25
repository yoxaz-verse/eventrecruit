import { authEmailDiagnostic, AuthEmailStageError } from "../src/lib/email/failure";
import { mxrouteConfigFromEnv, verifyMxrouteConnection } from "../src/lib/email/mxroute-smtp";

async function main() {
  try {
    await verifyMxrouteConnection(mxrouteConfigFromEnv());
    console.log(JSON.stringify({
      event: "email_diagnostic_ok",
      transport: "mxroute_smtp",
      detail: "SMTP connection, STARTTLS, and mailbox authentication succeeded. No email was sent.",
    }));
  } catch (error) {
    const diagnostic = error instanceof AuthEmailStageError
      ? authEmailDiagnostic(error)
      : { stage: "smtp_delivery", category: "smtp_unexpected" };
    console.error(JSON.stringify({ event: "email_diagnostic_failed", transport: "mxroute_smtp", ...diagnostic }));
    process.exitCode = 1;
  }
}

void main();
