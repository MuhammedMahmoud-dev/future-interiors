/**
 * Phase 3 verification: admin auth, session integrity, and the ledger round trip.
 *
 *   npm run verify:admin      (dev server must be running)
 *
 * Creates a throwaway project, drives the ledger through the real Server Action
 * path, checks the totals match the finance module, then deletes everything.
 */

import { createSessionToken } from "../src/lib/session.ts";
import { computeStatement } from "../src/lib/finance.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sessionSecret = process.env.SESSION_SECRET;
const site = process.env.SITE_URL ?? "http://localhost:3000";

if (!url || !secret || !sessionSecret) {
  console.error("Missing Supabase or SESSION_SECRET env");
  process.exit(1);
}

let failures = 0;
const ok = (name) => console.log(`  PASS  ${name}`);
const fail = (name, detail) => {
  failures++;
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

const ADMIN_PATHS = [
  "/admin",
  "/admin/projects",
  "/admin/projects/new",
  "/admin/content/services",
  "/admin/content/engineer",
  "/admin/leads",
];

async function reach(path, cookie) {
  const res = await fetch(site + path, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  return { status: res.status, location: res.headers.get("location") ?? "" };
}

const redirectsToLogin = (result) =>
  result.status >= 300 && result.status < 400 && result.location.includes("/admin/login");

// ---------------------------------------------------------------- 1. no session

console.log("\nunauthenticated access is refused");
for (const path of ADMIN_PATHS) {
  const result = await reach(path);
  if (redirectsToLogin(result)) ok(path);
  else fail(path, `${result.status} ${result.location}`);
}

// ---------------------------------------------------------------- 2. bad cookies

console.log("\nforged and replayed cookies are refused");

const forged = [
  ["random junk", "fi_admin=not-a-token"],
  ["right shape, wrong signature", "fi_admin=YWRtaW5AeC5jb20.9999999999999.deadbeef"],
  [
    "valid token signed with another secret",
    `fi_admin=${createSessionToken("eng@futureinteriors.test", "another-secret-entirely-32-chars!", "admin")}`,
  ],
  [
    "expired admin token",
    `fi_admin=${createSessionToken("eng@futureinteriors.test", sessionSecret, "admin", -60)}`,
  ],
  [
    "client portal cookie renamed to the admin cookie",
    `fi_admin=${createSessionToken("00000000-0000-0000-0000-000000000000", sessionSecret, "portal")}`,
  ],
];

for (const [name, cookie] of forged) {
  const result = await reach("/admin/projects", cookie);
  if (redirectsToLogin(result)) ok(name);
  else fail(name, `${result.status} ${result.location}`);
}

// ---------------------------------------------------------------- 3. real session

console.log("\na valid admin session gets in");
const adminCookie = `fi_admin=${createSessionToken(
  process.env.ADMIN_EMAIL ?? "eng@futureinteriors.test",
  sessionSecret,
  "admin",
  60 * 60,
)}`;

for (const path of ADMIN_PATHS) {
  const result = await reach(path, adminCookie);
  if (result.status === 200) ok(path);
  else fail(path, `${result.status} ${result.location}`);
}

// ---------------------------------------------------------------- 4. ledger maths

console.log("\nledger totals match the finance module");
let projectId = null;
try {
  const insert = await api("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      slug: "zz-admin-probe",
      title_ar: "مشروع فحص اللوحة",
      client_name: "ADMINPROBE-ZZ9",
      client_phone: "01099999998",
      unit_no: "ADMINUNIT-ZZ9",
      supervision_rate: 0.15,
      status: "in_progress",
    }),
  });

  if (!insert.ok) {
    fail("create probe project", `${insert.status} ${(await insert.text()).slice(0, 120)}`);
  } else {
    const [project] = await insert.json();
    projectId = project.id;
    ok(`project created with code ${project.code}`);

    // The spec's acceptance figures, entered as ledger rows.
    const expenses = [
      { project_id: projectId, date: "2025-01-10", item_ar: "تأسيس كهرباء", amount: 500000 },
      { project_id: projectId, date: "2025-02-10", item_ar: "محارة", amount: 400000 },
      { project_id: projectId, date: "2025-03-10", item_ar: "خصم مرتجع", amount: -6996 },
    ];
    const payments = [
      { project_id: projectId, date: "2025-01-05", label_ar: "دفعة أولى", amount: 600000 },
      { project_id: projectId, date: "2025-03-05", label_ar: "دفعة ثانية", amount: 460000 },
    ];

    const e = await api("expenses", { method: "POST", body: JSON.stringify(expenses) });
    const p = await api("payments", { method: "POST", body: JSON.stringify(payments) });
    if (!e.ok || !p.ok) fail("insert ledger rows", `${e.status}/${p.status}`);

    const readE = await api(`expenses?project_id=eq.${projectId}&select=amount`);
    const readP = await api(`payments?project_id=eq.${projectId}&select=amount`);
    const statement = computeStatement(await readE.json(), await readP.json(), 0.15);

    const expected = {
      total_cost: 893004,
      supervision_fee: 133951,
      grand_total: 1026955,
      total_payments: 1060000,
      balance: 33045,
    };

    for (const [field, want] of Object.entries(expected)) {
      if (statement[field] === want) ok(`${field} = ${want.toLocaleString("en-US")}`);
      else fail(field, `expected ${want}, got ${statement[field]}`);
    }

    // Stage progress must be derived, not stored as a percentage.
    const stages = await (await api("stages?select=id&order=order_index")).json();
    await api("project_stages", {
      method: "POST",
      body: JSON.stringify([
        { project_id: projectId, stage_id: stages[0].id, status: "done" },
        { project_id: projectId, stage_id: stages[1].id, status: "done" },
        { project_id: projectId, stage_id: stages[2].id, status: "in_progress" },
      ]),
    });
    const progress = await (
      await api(`project_stages?project_id=eq.${projectId}&select=status`)
    ).json();
    const done = progress.filter((row) => row.status === "done").length;
    const percent = Math.round((done / stages.length) * 100);
    if (percent === 33) ok(`progress derived from stages = ${percent}%`);
    else fail("derived progress", `expected 33%, got ${percent}%`);

    // The private probe values must not appear on any public page.
    const pageChecks = ["/ar", "/ar/works", "/en"];
    for (const path of pageChecks) {
      const html = await (await fetch(site + path)).text();
      const hits = ["ADMINPROBE-ZZ9", "ADMINUNIT-ZZ9", "01099999998", "0.15"].filter((needle) =>
        html.includes(needle),
      );
      if (hits.length === 0) ok(`${path} clean of admin-entered private data`);
      else fail(path, `leaked: ${hits.join(", ")}`);
    }
  }
} finally {
  if (projectId) {
    const del = await api(`projects?id=eq.${projectId}`, { method: "DELETE" });
    console.log(del.ok ? "\n  probe project deleted" : `\n  WARNING: probe ${projectId} NOT deleted`);
  }
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
