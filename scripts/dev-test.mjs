/**
 * The dev server, on the TEST database.
 *
 *   npm run dev:test
 *
 * Why a wrapper instead of `node --env-file=.env.test next dev`: the `next`
 * binary re-executes node with NODE_OPTIONS, and node refuses --env-file there
 * ("--env-file= is not allowed in NODE_OPTIONS"). The server simply never
 * starts — and a server that never started renders no gallery images, which
 * looks exactly like a server correctly pointed at an empty test database. That
 * ambiguity cost a wrong conclusion once already.
 *
 * So this process loads the env itself and spawns Next as a child, which
 * inherits it normally. No secrets on the command line, nothing in NODE_OPTIONS.
 *
 * It matters because the verification scripts drive this server. If it were
 * reading .env.local, they would write fixtures to the test database while the
 * Server Actions they invoke deleted from production.
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

import { requireTestDatabase } from "./lib/test-db.mjs";

/** Minimal .env parser: KEY=VALUE, ignoring blanks, comments and quotes. */
function readEnvFile(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = readEnvFile(".env.test");

// Same barrier as every verification script: refuse production outright.
Object.assign(process.env, env);
const { ref } = requireTestDatabase();

console.log(`\ndev server on the TEST database (${ref})\n`);

/*
 * Next also reads .env.local from disk, but @next/env never overwrites a
 * variable already present in process.env — so what we pass here wins.
 */
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)],
  { stdio: "inherit", env: { ...process.env, ...env } },
);

child.on("exit", (code) => process.exit(code ?? 0));
