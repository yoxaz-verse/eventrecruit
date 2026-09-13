import "server-only";
import { createHash, createHmac, randomBytes, scrypt as callbackScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
export { generateOtp } from "./otp-code";

const scrypt = promisify(callbackScrypt);

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

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltHex, keyHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !/^[0-9a-f]{32}$/.test(saltHex ?? "") || !/^[0-9a-f]{128}$/.test(keyHex ?? "")) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return timingSafeEqual(expected, actual);
}
