import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, getSessionSecret, readSessionToken } from "./session";
import { verifyPassword } from "./password";

/**
 * Single-user admin auth.
 *
 * The password lives as a scrypt hash in ADMIN_PASSWORD_HASH, never in the
 * database and never in plaintext. Sessions reuse the signed-cookie primitive,
 * bound to the "admin" purpose so a client portal cookie cannot be replayed
 * here.
 *
 * ponytail: rotating the password means changing the env var and redeploying.
 * Move the hash into a table if self-service password change is ever wanted.
 */

/** True only when both the email and the password match the configured admin. */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (!configuredEmail || !configuredHash) {
    console.error("[admin] ADMIN_EMAIL or ADMIN_PASSWORD_HASH is not configured");
    return false;
  }

  // Compare the email case-insensitively, but still verify the password so the
  // work done is the same either way.
  const emailMatches = email.trim().toLowerCase() === configuredEmail.trim().toLowerCase();
  const passwordMatches = verifyPassword(password, configuredHash);
  return emailMatches && passwordMatches;
}

export async function getAdminEmail(): Promise<string | null> {
  const store = await cookies();
  return readSessionToken(store.get(ADMIN_COOKIE)?.value, getSessionSecret(), "admin");
}

/** Guard for every admin page and every admin Server Action. */
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/login");
  return email;
}
