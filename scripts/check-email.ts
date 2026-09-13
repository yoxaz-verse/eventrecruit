import nodemailer from "nodemailer";
import { authEmailDiagnostic, classifyAuthEmailFailure } from "../src/lib/email/failure";

const host = process.env.SMTP_HOST?.trim();
const port = Number(process.env.SMTP_PORT);
const user = process.env.SMTP_AUTH_USER?.trim();
const pass = process.env.SMTP_AUTH_PASS;
const secure = process.env.SMTP_SECURE;

if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535 || !["true", "false"].includes(secure ?? "")) {
  console.error(JSON.stringify({ event: "smtp_verify_failed", stage: "smtp_delivery", category: "smtp_configuration" }));
  process.exitCode = 1;
} else {
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
  try {
    await transport.verify();
    console.log(JSON.stringify({ event: "smtp_verify_ok", detail: "SMTP connection and authentication succeeded; no email was sent." }));
  } catch (error) {
    console.error(JSON.stringify({ event: "smtp_verify_failed", ...authEmailDiagnostic(classifyAuthEmailFailure("smtp_delivery", error)) }));
    process.exitCode = 1;
  } finally {
    transport.close();
  }
}
