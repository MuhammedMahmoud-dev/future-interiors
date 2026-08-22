/**
 * Verifies that folding fields away did not stop them being saved.
 *
 *   npm run verify:fields      (dev server must be running)
 *
 * A closed <details> keeps its inputs in the DOM and submits them, so hiding
 * them is safe in principle. This checks it in practice, against the real
 * Server Action, in the two ways it could go wrong:
 *
 *   1. a create that fills the collapsed fields must persist all seven
 *   2. an edit that never opens the block must leave the existing values alone
 *
 * (2) is the dangerous one. If the payload stopped writing those columns, or
 * the form stopped submitting them, an ordinary save would quietly blank data
 * the engineer entered months ago, with nothing on screen to show it happened.
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

const MANIFEST_PATH = existsSync(".next/dev/server/server-reference-manifest.json")
  ? ".next/dev/server/server-reference-manifest.json"
  : ".next/server/server-reference-manifest.json";

function findActionId(exportName) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")).node;
  return (
    Object.entries(manifest).find(
      ([, v]) =>
        v.exportedName === exportName && v.filename === "src/app/admin/projects/actions.ts",
    )?.[0] ?? null
  );
}

/**
 * Referenced entries first — the reply decoder reads the parts in order.
 *
 * `bound` carries the arguments the form supplies via .bind(): updateProject is
 * (id, previousState, formData), so omitting the id makes the call land on
 * nothing at all and return a cheerful 200. createProject has no bound args.
 */
function post(path, actionId, fields, bound = []) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(`_1_${k}`, v);
  body.set("0", JSON.stringify([...bound, null, "$K1"]));
  return fetch(site + path, {
    method: "POST",
    headers: { "Next-Action": actionId, cookie },
    body,
    redirect: "manual",
  });
}

/** Exactly what the form still submits, all of it now inside <details>. */
const DETAILS = {
  unit_no: "12A",
  building_no: "B7",
  compound: "كمبوند الاختبار",
  district: "الشيخ زايد",
  area_m2: "185",
  start_date: "2025-03-01",
  end_date: "2025-09-30",
};

const SLUG = "zz-fields-probe";
let project = null;

try {
  console.log("\nfixture");
  await api(`projects?slug=eq.${SLUG}`, { method: "DELETE" });

  await fetch(`${site}/admin/projects/new`, { headers: { cookie } });
  const createId = findActionId("createProject");
  const updateId = findActionId("updateProject");
  if (!createId || !updateId) {
    fail("action ids", "not in the server reference manifest");
    process.exit(1);
  }
  ok(`createProject ${createId.slice(0, 12)}… / updateProject ${updateId.slice(0, 12)}…`);

  // ------------------------------------------- 1. a create keeps all seven

  console.log("\na create fills the collapsed fields");
  const created = await post("/admin/projects/new", createId, {
    title_ar: "مشروع فحص الحقول",
    supervision_rate: "0.15",
    status: "in_progress",
    ...DETAILS,
  });

  [project] = await (
    await api(`projects?title_ar=eq.${encodeURIComponent("مشروع فحص الحقول")}&select=*`)
  ).json();

  if (!project) {
    fail("create", `no row (${created.status})`);
    process.exit(1);
  }
  ok(`created ${project.code}`);

  for (const [field, sent] of Object.entries(DETAILS)) {
    const stored = String(project[field] ?? "");
    const matches = field === "area_m2" ? Number(stored) === Number(sent) : stored === sent;
    if (matches) ok(`${field} = ${stored}`);
    else fail(field, `sent ${sent}, stored ${stored || "null"}`);
  }

  // -------------------- 2. an edit that never opens the block preserves them

  console.log("\nan edit that never opens the block preserves them");

  /*
   * This is the real browser's payload: a closed <details> still submits, so
   * every collapsed field is present with the value it was rendered with. The
   * engineer changed only the title.
   */
  await fetch(`${site}/admin/projects/${project.id}`, { headers: { cookie } });
  const edited = await post(
    `/admin/projects/${project.id}`,
    updateId,
    {
      title_ar: "مشروع فحص الحقول — بعد التعديل",
      supervision_rate: "0.15",
      status: "in_progress",
      ...DETAILS,
    },
    [project.id],
  );

  const [after] = await (await api(`projects?id=eq.${project.id}&select=*`)).json();
  if (after?.title_ar?.includes("بعد التعديل")) ok("the title change landed");
  else fail("edit", `title unchanged (${edited.status})`);

  const lost = Object.keys(DETAILS).filter((f) => {
    const before = String(project[f] ?? "");
    const now = String(after?.[f] ?? "");
    return f === "area_m2" ? Number(before) !== Number(now) : before !== now;
  });
  if (lost.length === 0) ok("all seven collapsed fields survived the save");
  else fail("data lost on save", lost.join(", "));

  // ------------------- 3. a description already stored is never overwritten

  console.log("\na stored description is not erased by a save");
  await api(`projects?id=eq.${project.id}`, {
    method: "PATCH",
    body: JSON.stringify({ description_ar: "وصف اتكتب قبل التغيير" }),
  });

  await post(
    `/admin/projects/${project.id}`,
    updateId,
    {
      title_ar: "مشروع فحص الحقول — حفظ تاني",
      supervision_rate: "0.15",
      status: "in_progress",
      ...DETAILS,
    },
    [project.id],
  );

  const [final] = await (
    await api(`projects?id=eq.${project.id}&select=description_ar`)
  ).json();
  if (final?.description_ar === "وصف اتكتب قبل التغيير") ok("the old description is still there");
  else fail("description erased", `now ${final?.description_ar ?? "null"}`);
} finally {
  console.log("\ncleanup");
  const res = await api(`projects?title_ar=like.${encodeURIComponent("مشروع فحص الحقول*")}`, {
    method: "DELETE",
  });
  console.log(`  probe: ${res.ok ? "removed" : `NOT removed (${res.status})`}`);
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
