import addressparser from "nodemailer/lib/addressparser";
import { AuthEmailStageError } from "./failure";
import { buildAuthEmail, type AuthEmailPurpose } from "./message";

const endpoint = "https://smtpapi.mxroute.com/";

export type MxrouteConfig = {
  server: string;
  username: string;
  password: string;
  from: string;
};

export function senderAddress(from: string) {
  if (/[\r\n]/.test(from)) throw new AuthEmailStageError("smtp_delivery", "mxroute_api_configuration");
  const parsed = addressparser(from);
  const address = parsed[0]?.address;
  if (parsed.length !== 1 || !address || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address)) {
    throw new AuthEmailStageError("smtp_delivery", "mxroute_api_configuration");
  }
  return address;
}

function providerCategory(message: unknown) {
  if (typeof message !== "string") return "mxroute_api_rejected";
  const normalized = message.toLowerCase();
  if (normalized.includes("authentication failed")) return "mxroute_api_auth";
  if (normalized.includes("invalid server")) return "mxroute_api_invalid_server";
  if (normalized.includes("rate limit")) return "mxroute_api_rate_limit";
  return "mxroute_api_rejected";
}

export async function sendMxrouteEmail(
  config: MxrouteConfig,
  email: string,
  code: string,
  purpose: AuthEmailPurpose,
  fetcher: typeof fetch = fetch,
) {
  const from = senderAddress(config.from);
  if (!config.server || !config.username || !config.password || from.toLowerCase() !== config.username.toLowerCase()) {
    throw new AuthEmailStageError("smtp_delivery", "mxroute_api_configuration");
  }
  const message = buildAuthEmail(code, purpose);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let response: Response;
  try {
    response = await fetcher(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        server: config.server,
        username: config.username,
        password: config.password,
        from,
        to: email,
        subject: message.subject,
        body: message.html,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    clearTimeout(timeout);
    throw new AuthEmailStageError("smtp_delivery",
      controller.signal.aborted || name === "AbortError" || name === "TimeoutError"
        ? "mxroute_api_timeout" : "mxroute_api_connection");
  }

  if (response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500) {
    clearTimeout(timeout);
    if (response.status === 401 || response.status === 403) throw new AuthEmailStageError("smtp_delivery", "mxroute_api_auth");
    if (response.status === 429) throw new AuthEmailStageError("smtp_delivery", "mxroute_api_rate_limit");
    throw new AuthEmailStageError("smtp_delivery", "mxroute_api_http_failure");
  }
  let body: unknown;
  try { body = await response.json(); }
  catch (error) {
    const name = error instanceof Error ? error.name : "";
    throw new AuthEmailStageError("smtp_delivery",
      controller.signal.aborted || name === "AbortError" || name === "TimeoutError"
        ? "mxroute_api_timeout" : response.ok ? "mxroute_api_invalid_response" : "mxroute_api_http_failure");
  } finally { clearTimeout(timeout); }
  const result = body && typeof body === "object" ? body as { success?: unknown; message?: unknown } : null;
  if (response.ok && result?.success === true) return;
  if (result?.success === false) throw new AuthEmailStageError("smtp_delivery", providerCategory(result.message));
  throw new AuthEmailStageError("smtp_delivery", response.ok ? "mxroute_api_invalid_response" : "mxroute_api_http_failure");
}
