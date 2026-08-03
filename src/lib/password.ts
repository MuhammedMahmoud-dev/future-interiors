import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing for the single admin user.
 *
 * Kept free of Next imports so the tests exercise this exact code rather than a
 * copy of it. scrypt is deliberately slow and salted per password.
 */

const KEY_LENGTH = 64;

export function hashPassword(
  password: string,
  salt: string = randomBytes(16).toString("hex"),
): string {
  return `${salt}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored ?? "").split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  // Buffer.from ignores invalid hex rather than throwing, so check the length.
  if (expected.length !== KEY_LENGTH) return false;

  return timingSafeEqual(scryptSync(password, salt, KEY_LENGTH), expected);
}
