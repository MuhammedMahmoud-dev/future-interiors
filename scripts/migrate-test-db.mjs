/**
 * Runs every migration, in order, against the TEST database.
 *
 *   node --env-file=.env.test scripts/migrate-test-db.mjs          # dry run
 *   node --env-file=.env.test scripts/migrate-test-db.mjs apply
 *
 * Two ways to get the SQL in, because the direct one needs a token you may not
 * want to create:
 *
 *   1. With SUPABASE_ACCESS_TOKEN set, it executes each file through Supabase's
 *      Management API and reports per-file results.
 *   2. Without it, it writes backups/test-db-migrations.sql — every migration
 *      concatenated in order — for one paste into the SQL editor.
 *
 * Either way the production guard runs first: this creates tables and would
 * fail loudly against a database that already has them, but "fails loudly" is
 * not a safety model.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { requireTestDatabase } from "./lib/test-db.mjs";

// Refuses outright if this is production. See scripts/lib/test-db.mjs.
const { ref } = requireTestDatabase();

const APPLY = process.argv[2] === "apply";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const DIR = "supabase/migrations";

const files = readdirSync(DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort(); // 0001_, 0002_, … — the numeric prefix IS the order

if (files.length === 0) {
  console.error(`No .sql files in ${DIR}`);
  process.exit(1);
}

console.log(`\ntarget project: ${ref}`);
console.log(`${files.length} migration(s), in order:\n`);
for (const file of files) {
  const sql = readFileSync(path.join(DIR, file), "utf8");
  const statements = sql.split(";").filter((chunk) => chunk.trim().length > 0).length;
  console.log(`  ${file.padEnd(34)} ${String(statements).padStart(3)} statement(s)`);
}

if (!APPLY) {
  console.log("\nDry run. Re-run with `apply`.\n");
  process.exit(0);
}

// ------------------------------------------------------------------ apply

if (!TOKEN) {
  /*
   * No token: produce one file to paste. Deliberately not a silent failure —
   * the migrations are not idempotent, so a half-applied schema is worse than
   * an unapplied one, and pasting once is easier to get right than six times.
   */
  const bundle = files
    .map((file) => {
      const sql = readFileSync(path.join(DIR, file), "utf8");
      return `-- ${"=".repeat(70)}\n-- ${file}\n-- ${"=".repeat(70)}\n\n${sql}`;
    })
    .join("\n\n");

  mkdirSync("backups", { recursive: true });
  const out = path.join("backups", "test-db-migrations.sql");
  writeFileSync(out, bundle, "utf8");

  console.log(`\nSUPABASE_ACCESS_TOKEN is not set, so nothing was executed.`);
  console.log(`\nWrote ${out} — every migration in order, as one paste.`);
  console.log("\n  1. Supabase dashboard -> your TEST project -> SQL Editor");
  console.log("  2. Paste the whole file, Run");
  console.log("  3. Re-run this script to confirm (it will report what exists)\n");
  process.exit(0);
}

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

console.log("\napplying via the Management API\n");

for (const file of files) {
  const sql = readFileSync(path.join(DIR, file), "utf8");
  const result = await runSql(sql);

  if (result.ok) {
    console.log(`  OK    ${file}`);
  } else {
    console.log(`  FAIL  ${file} — ${result.status}`);
    console.log(`        ${result.body.slice(0, 300)}`);
    console.log("\nStopped. Migrations are not idempotent — fix this one before re-running.\n");
    process.exit(1);
  }
}

console.log("\nAll migrations applied.\n");
