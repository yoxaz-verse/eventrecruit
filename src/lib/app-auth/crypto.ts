import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
export {hashPassword,verifyPassword} from "@/lib/password-hash";
export { generateOtp } from "./otp-code";

export function authSecret() {
  const secret = process.env.APP_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("APP_AUTH_SECRET must contain at least 32 characters.");
  return secret;
}

export function digest(value: string) {
  return createHmac("sha256", authSecret()).update(value).digest("hex");
}

export function generateToken() {
  return randomBytes(32).toString("base64url");
}

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
