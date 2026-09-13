import "server-only";
import nodemailer from "nodemailer";

export function createAuthTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_AUTH_USER?.trim();
  const pass = process.env.SMTP_AUTH_PASS;
  const from = process.env.SMTP_FROM?.trim();
  const secure = process.env.SMTP_SECURE;

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !user ||
    !pass ||
    !from ||
    /[\r\n]/.test(`${from}${user}`) ||
    !["true", "false"].includes(secure ?? "")
  ) {
    throw Object.assign(new Error("SMTP configuration is incomplete."), { code: "SMTP_CONFIGURATION" });
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: secure === "true",
    requireTLS: secure !== "true",
    auth: { user, pass },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
    tls: { minVersion: "TLSv1.2", servername: host },
    logger: false,
    debug: false,
  });

  return { transport, from };
}
