/**
 * Generates the ADMIN_PASSWORD_HASH value.
 *
 *   node scripts/admin-password.mjs "your password here"
 *
 * Copy the printed line into .env.local (and into the Vercel environment).
 * The plaintext password is never stored anywhere.
 */

import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error('usage: node scripts/admin-password.mjs "your password"');
  process.exit(1);
}

if (password.length < 10) {
  console.error("Use at least 10 characters — this is the only lock on every client's data.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");

console.log(`ADMIN_PASSWORD_HASH=${salt}:${hash}`);
