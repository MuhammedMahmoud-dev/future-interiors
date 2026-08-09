/**
 * Exports every table to dated JSON files.
 *
 *   node --env-file=.env.local scripts/backup-export.mjs
 *
 * This system is the only digital record of statements running into millions of
 * pounds, and Supabase's free plan has no point-in-time recovery. A wrong
 * migration or a mistaken delete is unrecoverable without one of these.
 *
 * Output: backups/<YYYY-MM-DD>/<table>.json, plus manifest.json carrying the row
 * counts and the export timestamp so a restore can be checked against what was
 * actually taken.
 *
 * login_attempts is skipped deliberately — it is a rate-limiting scratchpad that
 * ages out on its own and would only bloat the archive.
 *
 * See OPERATIONS.md for the restore procedure and for scheduling.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

/**
 * Parents before children. The order is not needed for the export itself, but a
 * restore must insert in exactly this sequence or the foreign keys reject it —
 * so the file that documents the order is the file that produced the data.
 */
const TABLES = [
  "clients",
  "stages",
  "projects",
  "expenses",
  "payments",
  "project_stages",
  "project_media",
  "services",
  "testimonials",
  "faqs",
  "site_stats",
  "engineer_profile",
  "leads",
  // The whole point of this table is remembering what is gone; a backup that
  // skipped it would lose exactly the thing it was created to preserve.
  "deleted_projects_log",
];

/*
 * PostgREST's own cap. Overridable only so the paging loop can be exercised
 * against small tables — BACKUP_PAGE_SIZE=2 forces many pages over a handful of
 * rows and must produce exactly the same totals. Untested pagination is how a
 * backup ends up quietly truncated at row 1000.
 */
const PAGE = Number(process.env.BACKUP_PAGE_SIZE) || 1000;

/**
 * A stable sort key per table. Paging without one is unsound — Postgres may
 * return rows in a different order between requests, so pages could overlap or
 * skip rows entirely and the export would be quietly wrong.
 *
 * Everything has an `id` except project_stages, whose primary key is the
 * composite (project_id, stage_id).
 */
const ORDER = {
  project_stages: "project_id.asc,stage_id.asc",
};
const orderFor = (table) => ORDER[table] ?? "id.asc";

/**
 * Reads a whole table, one page at a time.
 *
 * PostgREST caps a response at 1000 rows. A ledger across a few dozen projects
 * passes that easily, and a backup that silently stops at the cap is worse than
 * no backup at all, because it looks complete. Paging continues until a short
 * page arrives, and the caller cross-checks the total against count=exact.
 */
async function fetchAll(table) {
  const rows = [];

  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&order=${orderFor(table)}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${from}-${from + PAGE - 1}`,
        "Range-Unit": "items",
      },
    });

    if (!res.ok) throw new Error(`${table}: ${res.status} ${(await res.text()).slice(0, 160)}`);

    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE) break;
  }

  return rows;
}

/** The server's own count, so pagination can be proven rather than assumed. */
async function serverCount(table) {
  // select=* rather than id — project_stages has no id column.
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const range = res.headers.get("content-range") ?? "";
  const total = range.split("/")[1];
  return total === "*" ? null : Number(total);
}

const stamp = new Date().toISOString();
const day = stamp.slice(0, 10);
const outDir = path.join(process.cwd(), "backups", day);
mkdirSync(outDir, { recursive: true });

const manifest = { exported_at: stamp, tables: {}, restore_order: TABLES };
let mismatch = 0;

for (const table of TABLES) {
  const [rows, expected] = await Promise.all([fetchAll(table), serverCount(table)]);

  writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(rows, null, 2), "utf8");
  manifest.tables[table] = { rows: rows.length, server_count: expected };

  // The whole point of the paging loop. If these ever disagree, the export is
  // short and must not be trusted as a backup.
  const agree = expected === null || expected === rows.length;
  if (!agree) mismatch++;

  console.log(
    `${table.padEnd(17)} ${String(rows.length).padStart(6)} rows` +
      (agree ? "" : `   MISMATCH — server reports ${expected}`),
  );
}

writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

const total = Object.values(manifest.tables).reduce((n, t) => n + t.rows, 0);
console.log(`\n${total} rows across ${TABLES.length} tables -> backups/${day}/`);

if (mismatch > 0) {
  console.error(`\n${mismatch} table(s) did not match the server count — DO NOT trust this export.`);
  process.exit(1);
}

console.log("manifest.json written; every table matches the server count.");
