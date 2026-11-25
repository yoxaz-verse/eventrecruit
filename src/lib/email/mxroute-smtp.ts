import nodemailer from "nodemailer";
import addressparser from "nodemailer/lib/addressparser";
import { AuthEmailStageError } from "./failure";
import { buildAuthEmail, type AuthEmailPurpose } from "./message";

export type MxrouteConfig = {
  server: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
};

export type MailTransport = {
  sendMail(message: { from: string; to: string; subject: string; text?: string; html: string }): Promise<unknown>;
  verify(): Promise<unknown>;
};

export function senderAddress(from: string) {
  if (/[\r\n]/.test(from)) throw new AuthEmailStageError("smtp_delivery", "smtp_sender_invalid");
  const trimmed = from.trim();
  const normalized = trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1).trim() : trimmed;
  const parsed = addressparser(normalized);
  const address = parsed[0]?.address;
  if (parsed.length !== 1 || !address || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address)) {
    throw new AuthEmailStageError("smtp_delivery", "smtp_sender_invalid");
  }
  return address;
}

function port(value: string | undefined) {
  const parsed = Number(value ?? "587");
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new AuthEmailStageError("smtp_delivery", "smtp_port_invalid");
  }
  return parsed;
}

function secure(value: string | undefined) {
  const normalized = (value ?? "false").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new AuthEmailStageError("smtp_delivery", "smtp_secure_invalid");
}

export function mxrouteConfigFromEnv(): MxrouteConfig {
  return {
    server: process.env.SMTP_HOST?.trim() ?? "",
    port: port(process.env.SMTP_PORT),
    secure: secure(process.env.SMTP_SECURE),
    username: process.env.SMTP_AUTH_USER?.trim() ?? "",
    password: process.env.SMTP_AUTH_PASS ?? "",
    from: process.env.SMTP_FROM?.trim() ?? "",
  };
}

function validateConfig(config: MxrouteConfig) {
  if (!config.server) throw new AuthEmailStageError("smtp_delivery", "smtp_server_missing");
  if (!config.username) throw new AuthEmailStageError("smtp_delivery", "smtp_username_missing");
  if (!config.password) throw new AuthEmailStageError("smtp_delivery", "smtp_password_missing");
  const from = senderAddress(config.from);
  if (from.toLowerCase() !== config.username.toLowerCase()) {
    throw new AuthEmailStageError("smtp_delivery", "smtp_sender_mismatch");
  }
  return from;
}

function smtpFailure(error: unknown) {
  const candidate = error && typeof error === "object"
    ? error as { code?: unknown; responseCode?: unknown; command?: unknown }
    : {};
  const code = typeof candidate.code === "string" ? candidate.code.toUpperCase() : "";
  const responseCode = typeof candidate.responseCode === "number" ? candidate.responseCode : 0;
  const command = typeof candidate.command === "string" ? candidate.command.toUpperCase() : "";
  if (code === "EAUTH" || command === "AUTH" || responseCode === 535) return "smtp_auth";
  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT") return "smtp_timeout";
  if (["ECONNECTION", "ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "EAI_AGAIN"].includes(code)) return "smtp_connection";
  if (["ETLS", "ECERT", "EPROTOCOL"].includes(code)) return "smtp_tls";
  if ([421, 450, 451, 452].includes(responseCode)) return "smtp_rate_limit";
  if (responseCode >= 500 || code === "EENVELOPE" || code === "EMESSAGE") return "smtp_rejected";
  return "smtp_unexpected";
}

export function createMxrouteTransport(config: MxrouteConfig): MailTransport {
  validateConfig(config);
  return nodemailer.createTransport({
    host: config.server,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: { user: config.username, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
  }) as MailTransport;
}

export async function verifyMxrouteConnection(config: MxrouteConfig, transport?: MailTransport) {
  try {
    await (transport ?? createMxrouteTransport(config)).verify();
  } catch (error) {
    if (error instanceof AuthEmailStageError) throw error;
    throw new AuthEmailStageError("smtp_delivery", smtpFailure(error));
  }
}

export async function sendMxrouteMessage(
  config: MxrouteConfig,
  message: { to: string; subject: string; text?: string; html: string },
  transport?: MailTransport,
) {
  const from = validateConfig(config);
  try {
    await (transport ?? createMxrouteTransport(config)).sendMail({ from, ...message });
  } catch (error) {
    if (error instanceof AuthEmailStageError) throw error;
    throw new AuthEmailStageError("smtp_delivery", smtpFailure(error));
  }
}

export async function sendMxrouteEmail(
  config: MxrouteConfig,
  email: string,
  code: string,
  purpose: AuthEmailPurpose,
  transport?: MailTransport,
) {
  const message = buildAuthEmail(code, purpose);
  await sendMxrouteMessage(config, {
    to: email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  }, transport);
}
