/**
 * Phase 5 verification: archiving is inert, and deleting is refused by the
 * SERVER rather than by the button.
 *
 *   npm run verify:lifecycle      (dev server must be running)
 *
 * Every call here goes straight at the Server Action over HTTP with a forged
 * admin cookie, and no browser or client JavaScript anywhere in the picture.
 * That is the whole point. The delete button's `disabled` attribute is a
 * courtesy to whoever is looking at the screen and proves nothing about the
 * endpoint: a Server Action is a public POST route, so the refusal has to live
 * inside the action, and the only honest way to check that is to call it the
 * way someone bypassing the UI would.
 *
 * Creates two throwaway projects — one carrying a single expense, one empty —
 * and removes both on the way out.
 */

import { existsSync, readFileSync } from "node:fs";

import { createSessionToken } from "../src/lib/session.ts";

import { assertSameDatabase, requireTestDatabase } from "./lib/test-db.mjs";

// Stops dead if this is production. See scripts/lib/test-db.mjs.
const { url, secret, sessionSecret } = requireTestDatabase();

const site = process.env.SITE_URL ?? "http://localhost:3000";

// And that the dev server we are about to drive reads that same database.
await assertSameDatabase({ url, secret, sessionSecret, site });

let failures = 0;
const ok = (name) => console.log(`  PASS  ${name}`);
const fail = (name, detail) => {
  failures += 1;
  console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
};

const api = (path, init = {}) =>
  fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

const cookie = `fi_admin=${createSessionToken(
  process.env.ADMIN_EMAIL ?? "eng@futureinteriors.test",
  sessionSecret,
  "admin",
  60 * 60,
)}`;

const LEDGERED = "zz-lifecycle-ledger";
const EMPTY = "zz-lifecycle-empty";

// ------------------------------------------------------------- action ids

/*
 * An action id is a build hash, so it has to be read out of the build rather
 * than written down here. Next records the export name alongside it, so the
 * lookup is exact rather than "the first hash that looks about right".
 *
 * Dev and a production build hash differently, and posting an id the running
 * server has never heard of does not fail — it hangs — so dev wins when both
 * are on disk.
 */
const MANIFEST_PATH = existsSync(".next/dev/server/server-reference-manifest.json")
  ? ".next/dev/server/server-reference-manifest.json"
  : ".next/server/server-reference-manifest.json";

function findActionId(exportName) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")).node;
  const hit = Object.entries(manifest).find(
    ([, value]) =>
      value.exportedName === exportName &&
      value.filename === "src/app/admin/projects/actions.ts",
  );
  return hit?.[0] ?? null;
}

// ------------------------------------------------------- calling an action

/**
 * deleteProject is wrapped in useActionState, so its real signature is
 * (previousState, formData) and the call has to carry both. React's reply
 * format puts the argument list in field "0" and refers to a FormData argument
 * as "$K1", whose own entries are flattened to "_1_<name>".
 *
 * Those entries must be written BEFORE field "0": the decoder walks the parts
 * with a forward-only cursor, so anything appended after the row that
 * references it is never seen, and the action receives an empty FormData.
 */
function callWithFormData(pagePath, actionId, fields, withCookie = true) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(`_1_${key}`, value);
  body.set("0", JSON.stringify([null, "$K1"]));

  return fetch(site + pagePath, {
    method: "POST",
    headers: { "Next-Action": actionId, ...(withCookie ? { cookie } : {}) },
    body,
    redirect: "manual",
  });
}

/** setProjectArchived takes plain arguments, which encode as a JSON body. */
function callWithArgs(pagePath, actionId, args) {
  return fetch(site + pagePath, {
    method: "POST",
    headers: { "Next-Action": actionId, "Content-Type": "text/plain;charset=UTF-8", cookie },
    body: JSON.stringify(args),
    redirect: "manual",
  });
}

const projects = {};

try {
  // ------------------------------------------------------------ 0. fixtures

  console.log("\nfixtures");
  for (const slug of [LEDGERED, EMPTY]) await api(`projects?slug=eq.${slug}`, { method: "DELETE" });

  for (const [key, slug, title] of [
    ["ledgered", LEDGERED, "مشروع فحص الحذف - فيه بند"],
    ["empty", EMPTY, "مشروع فحص الحذف - فاضي"],
  ]) {
    const res = await api("projects", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ slug, title_ar: title, supervision_rate: 0.15, status: "in_progress" }),
    });
    if (!res.ok) {
      fail(`create ${key}`, `${res.status} ${(await res.text()).slice(0, 100)}`);
      process.exit(1);
    }
    [projects[key]] = await res.json();
    ok(`${key} project ${projects[key].code}`);
  }

  const expense = await api("expenses", {
    method: "POST",
    body: JSON.stringify([
      { project_id: projects.ledgered.id, date: "2025-06-01", item_ar: "بند واحد بس", amount: 1000 },
    ]),
  });
  if (expense.ok) ok("one expense on the ledgered project");
  else fail("insert expense", expense.status);

  const ledgeredPath = `/admin/projects/${projects.ledgered.id}`;
  const emptyPath = `/admin/projects/${projects.empty.id}`;

  // ------------------------------------------------- 1. read the action ids

  console.log(`\nserver action ids, from ${MANIFEST_PATH}`);

  // In dev the manifest is written as routes compile, so the page has to be
  // asked for once before its actions appear in it.
  const warm = await fetch(site + ledgeredPath, { headers: { cookie } });
  ok(`warmed /admin/projects/[id] (${warm.status})`);

  const deleteId = findActionId("deleteProject");
  const archiveId = findActionId("setProjectArchived");
  if (deleteId) ok(`deleteProject -> ${deleteId.slice(0, 12)}…`);
  else fail("deleteProject action id", "not in the server reference manifest");
  if (archiveId) ok(`setProjectArchived -> ${archiveId.slice(0, 12)}…`);
  else fail("setProjectArchived action id", "not in the server reference manifest");
  if (!deleteId || !archiveId) process.exit(1);

  const stillThere = async (id) =>
    (await (await api(`projects?id=eq.${id}&select=id`)).json()).length === 1;

  // ------------------------------ 2. one expense is enough to refuse a delete

  console.log("\na project with one expense refuses to be deleted");

  const refused = await callWithFormData(ledgeredPath, deleteId, {
    id: projects.ledgered.id,
    confirm: projects.ledgered.code, // the correct code — nothing else is holding this back
  });
  const refusedBody = await refused.text();

  if (refusedBody.includes("أرشفه بدل ما تحذفه"))
    ok(`the action returned: ${refusedBody.match(/مايتحذفش[^"]*/)?.[0] ?? "the ledger refusal"}`);
  else fail("ledger refusal", `not in the response (status ${refused.status})`);

  if (await stillThere(projects.ledgered.id)) ok("the project is still in the database");
  else fail("project deleted", "a project with a ledger was destroyed");

  const rows = await (await api(`expenses?project_id=eq.${projects.ledgered.id}&select=id`)).json();
  if (rows.length === 1) ok("its expense is untouched");
  else fail("expense count", `expected 1, got ${rows.length}`);

  // ------------------------------------------- 3. a wrong code is refused too

  console.log("\nthe typed confirmation is checked on the server");
  const wrong = await callWithFormData(emptyPath, deleteId, {
    id: projects.empty.id,
    confirm: "FI-XX-XXXX",
  });
  const wrongBody = await wrong.text();

  if (wrongBody.includes("كود المشروع اللي كتبته مش مطابق")) ok("mismatched code refused");
  else fail("code refusal", `not in the response (status ${wrong.status})`);

  if (await stillThere(projects.empty.id)) ok("the empty project survived a wrong code");
  else fail("deleted on a wrong code", "the confirmation is not enforced");

  // ------------------------------------------- 4. an unauthenticated call dies

  console.log("\nthe same call with no session at all");
  const anon = await callWithFormData(
    emptyPath,
    deleteId,
    { id: projects.empty.id, confirm: projects.empty.code },
    false,
  );
  if (await stillThere(projects.empty.id)) ok(`anonymous delete did nothing (${anon.status})`);
  else fail("anonymous delete succeeded", "requireAdmin is not guarding the action");

  // ------------------------------------------------- 5. archiving is inert

  console.log("\narchiving sets archived_at and touches nothing else");
  const [before] = await (
    await api(
      `projects?id=eq.${projects.ledgered.id}&select=portal_access_enabled,is_public,publish_approved_at`,
    )
  ).json();

  const archiveRes = await callWithArgs(ledgeredPath, archiveId, [projects.ledgered.id, true]);

  const [after] = await (
    await api(
      `projects?id=eq.${projects.ledgered.id}&select=archived_at,portal_access_enabled,is_public,publish_approved_at`,
    )
  ).json();

  if (after.archived_at) ok(`archived_at = ${after.archived_at.slice(0, 19)}`);
  else fail("archive", `archived_at is still null (${archiveRes.status})`);

  const changed = ["portal_access_enabled", "is_public", "publish_approved_at"].filter(
    (field) => after[field] !== before[field],
  );
  if (changed.length === 0) ok("portal access and publishing untouched");
  else fail("archiving had side effects", changed.join(", "));

  const restored = await callWithArgs(ledgeredPath, archiveId, [projects.ledgered.id, false]);
  const [back] = await (
    await api(`projects?id=eq.${projects.ledgered.id}&select=archived_at`)
  ).json();
  if (back.archived_at === null) ok("restoring clears it again");
  else fail("restore", `archived_at is still set (${restored.status})`);

  // --------------------------- 6. an empty project deletes and leaves a trace

  console.log("\nan empty project deletes, and is written to the log");
  await api(`deleted_projects_log?code=eq.${projects.empty.code}`, { method: "DELETE" });

  const deleted = await callWithFormData(emptyPath, deleteId, {
    id: projects.empty.id,
    confirm: projects.empty.code.toLowerCase(), // the comparison is case-insensitive
  });

  if (await stillThere(projects.empty.id)) fail("delete", `project survived (${deleted.status})`);
  else ok("the empty project is gone");

  const log = await (
    await api(`deleted_projects_log?code=eq.${projects.empty.code}&select=code,title_ar,deleted_at`)
  ).json();
  if (log.length === 1) ok(`logged ${log[0].code} at ${log[0].deleted_at.slice(0, 19)}`);
  else fail("delete log", `expected 1 row, got ${log.length}`);
} finally {
  console.log("\ncleanup");
  for (const slug of [LEDGERED, EMPTY]) {
    const res = await api(`projects?slug=eq.${slug}`, { method: "DELETE" });
    console.log(`  ${slug}: ${res.ok ? "removed" : `NOT removed (${res.status})`}`);
  }
  for (const project of Object.values(projects)) {
    await api(`deleted_projects_log?code=eq.${project.code}`, { method: "DELETE" });
  }
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
