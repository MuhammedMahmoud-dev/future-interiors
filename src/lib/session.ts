import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * Signed cookies for both the client portal and the admin panel.
 *
 * The token carries only a subject (a project id, or the admin email) and an
 * expiry. It never carries the project code — the code is the credential and
 * must not survive login in a URL or a cookie.
 *
 * Signatures are bound to a `purpose`, so a client portal cookie cannot be
 * replayed as an admin cookie even though both use the same secret and format.
 *
 * Kept free of Next imports so it can be unit tested directly.
 */

export type SessionPurpose = "portal" | "admin";

export const PORTAL_COOKIE = "fi_portal";
export const ADMIN_COOKIE = "fi_admin";
export const PORTAL_TTL_SECONDS = 60 * 60 * 8;
export const ADMIN_TTL_SECONDS = 60 * 60 * 12;

/** Kept for the portal's existing import. */
export const SESSION_COOKIE = PORTAL_COOKIE;
export const SESSION_TTL_SECONDS = PORTAL_TTL_SECONDS;

function sign(purpose: SessionPurpose, subject: string, expiresAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`${purpose}|${subject}|${expiresAt}`).digest("base64url");
}

/**
 * The subject is base64url-encoded because the token is dot-delimited and an
 * admin subject is an email address, which contains dots of its own.
 */
export function createSessionToken(
  subject: string,
  secret: string,
  purpose: SessionPurpose = "portal",
  ttlSeconds: number = PORTAL_TTL_SECONDS,
  now: number = Date.now(),
): string {
  const expiresAt = now + ttlSeconds * 1000;
  const encoded = Buffer.from(subject, "utf8").toString("base64url");
  return `${encoded}.${expiresAt}.${sign(purpose, encoded, expiresAt, secret)}`;
}

/** Returns the subject, or null if malformed, tampered with, wrong purpose, or expired. */
export function readSessionToken(
  token: string | undefined | null,
  secret: string,
  purpose: SessionPurpose = "portal",
  now: number = Date.now(),
): string | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encoded, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return null;

  const expected = sign(purpose, encoded, expiresAt, secret);

  // Constant-time compare; timingSafeEqual requires equal lengths.
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;

  if (expiresAt <= now) return null;

  return Buffer.from(encoded, "base64url").toString("utf8");
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
