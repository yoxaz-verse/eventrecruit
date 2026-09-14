import { senderAddress } from "../src/lib/email/mxroute-api";

async function main() {
  const server = process.env.SMTP_HOST?.trim();
  const username = process.env.SMTP_AUTH_USER?.trim();
  const password = process.env.SMTP_AUTH_PASS;
  const from = process.env.SMTP_FROM?.trim();
  try {
    if (!server || !username || !password || !from || senderAddress(from).toLowerCase() !== username.toLowerCase()) {
      throw new Error("configuration");
    }
  } catch {
    console.error(JSON.stringify({ event: "email_diagnostic_failed", transport: "mxroute_https_api", stage: "configuration", category: "mxroute_api_configuration" }));
    process.exitCode = 1;
    return;
  }

  try {
    const response = await fetch("https://smtpapi.mxroute.com/", {
      method: "HEAD",
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(JSON.stringify({ event: "email_diagnostic_failed", transport: "mxroute_https_api", stage: "reachability", category: "mxroute_api_http_failure", status: response.status }));
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify({ event: "email_diagnostic_ok", transport: "mxroute_https_api", detail: "HTTPS endpoint reachable; mailbox authentication and email delivery are not tested. No email was sent." }));
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    console.error(JSON.stringify({ event: "email_diagnostic_failed", transport: "mxroute_https_api", stage: "reachability", category: name === "TimeoutError" || name === "AbortError" ? "mxroute_api_timeout" : "mxroute_api_connection" }));
    process.exitCode = 1;
  }
}

void main();
