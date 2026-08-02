import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * Client portal session.
 *
 * The cookie carries only a project id and an expiry, signed with HMAC-SHA256.
 * It never contains the project code — the code is the credential, and it must
 * not survive login in either the URL or the cookie.
 *
 * Signing/verification is kept free of Next imports so it can be unit tested.
 */

export const SESSION_COOKIE = "fi_portal";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(
  projectId: string,
  secret: string,
  ttlSeconds: number = SESSION_TTL_SECONDS,
  now: number = Date.now(),
): string {
  const expiresAt = now + ttlSeconds * 1000;
  const payload = `${projectId}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the project id, or null if the token is malformed, tampered with, or expired. */
export function readSessionToken(
  token: string | undefined | null,
  secret: string,
  now: number = Date.now(),
): string | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [projectId, expiresAtRaw, signature] = parts;
  const expected = sign(`${projectId}.${expiresAtRaw}`, secret);

  // Compare in constant time; equal lengths are required by timingSafeEqual.
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;

  return projectId;
}

/** Fails loudly rather than falling back to a default secret. */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"",
    );
  }
  return secret;
}

export function generateSecret(): string {
  return randomBytes(32).toString("base64url");
}
