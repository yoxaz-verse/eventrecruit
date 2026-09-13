import { randomInt } from "node:crypto";

export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function validOtp(code: string) {
  return /^\d{6}$/.test(code);
}
