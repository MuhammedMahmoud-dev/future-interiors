/**
 * Proves two things that must never be wired together:
 *
 *   1. Archiving a client hides them from the admin list and NOTHING else.
 *      They can still open their own project statement with code and phone.
 *   2. projects.portal_access_enabled is the engineer's separate, explicit
 *      decision. Closing it locks even an existing session out at once;
 *      reopening it works while the client stays archived.
 *
 *   npm run verify:clients        (dev server must be running)
 *
 * Evidence is gathered at two levels, before and after archiving:
 *   1. the credential lookup the portal performs resolves the project
 *   2. the portal dashboard actually renders that project's statement
 *
 * Paired with src/lib/portalAccess.test.ts, which asserts the app's own query
 * has exactly this shape and never filters on archived_at.
 *
 * The fixture is removed in a finally block.
 */

import { createHmac } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const secret = process.env.SESSION_SECRET;
const site = process.env.SITE_URL ?? "http://localhost:3000";

if (!url || !key || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SESSION_SECRET");
  process.exit(1);
}

const NAME = "عميل الأرشفة التجريبي";
const PHONE_TYPED = "01033344455"; // as an admin would type it
const PHONE_STORED = "1033344455"; // normalised, as the column holds it
const SLUG = "zz-clients-fixture";

const api = (path, init = {}) =>
  fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

let failures = 0;
const ok = (name, detail) => console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
const fail = (name, detail) => {
  failures++;
  console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
};

/** Mirrors createSessionToken() in src/lib/session.ts. */
function portalCookie(projectId) {
  const expiresAt = Date.now() + 60 * 60 * 1000;
  const encoded = Buffer.from(projectId, "utf8").toString("base64url");
  const sig = createHmac("sha256", secret)
    .update(`portal|${encoded}|${expiresAt}`)
    .digest("base64url");
  return `fi_portal=${encoded}.${expiresAt}.${sig}`;
}

/**
 * The lookup the portal performs: find the project by code, read the phone
 * through the clients relation. Deliberately no archived_at filter — that
 * omission is the behaviour under test.
 */
async function credentialLookup(code, typedPhone) {
  const res = await api(
    `projects?code=eq.${encodeURIComponent(code)}&select=id,clients(phone)`,
  );
  if (!res.ok) return null;
  const [row] = await res.json();
  if (!row) return null;

  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  const normalise = (value) => {
    let digits = String(value ?? "").replace(/\D/g, "").replace(/^0+/, "");
    if (digits.startsWith("20")) digits = digits.slice(2).replace(/^0+/, "");
    return digits;
  };
  return normalise(client?.phone) === normalise(typedPhone) ? row.id : null;
}

async function dashboardReachable(projectId) {
  const res = await fetch(`${site}/ar/track/dashboard`, {
    headers: { cookie: portalCookie(projectId) },
    redirect: "manual",
  });
  const html = res.ok ? await res.text() : "";
  return { status: res.status, showsProject: html.includes("شقة الأرشفة") };
}

async function cleanup() {
  const res = await api(`projects?slug=eq.${SLUG}&select=id,code`);
  const [project] = res.ok ? await res.json() : [];
  if (project) {
    await api(`projects?id=eq.${project.id}`, { method: "DELETE" });
    await api(`login_attempts?code=eq.${project.code}`, { method: "DELETE" });
  }
  // Only after the project is gone: the FK is ON DELETE RESTRICT by design.
  await api(`clients?phone=eq.${PHONE_STORED}`, { method: "DELETE" });
}

let clientId = null;

try {
  await cleanup();

  // -------------------------------------------------------------- 1. fixture
  console.log("\nfixture");

  const clientRes = await api("clients", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ name: NAME, phone: PHONE_STORED }),
  });
  if (!clientRes.ok) {
    fail("create client", `${clientRes.status} ${(await clientRes.text()).slice(0, 120)}`);
    throw new Error("cannot continue without a client");
  }
  [{ id: clientId }] = await clientRes.json();
  ok("client created");

  const projectRes = await api("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      slug: SLUG,
      title_ar: "شقة الأرشفة التجريبية",
      client_id: clientId,
      status: "in_progress",
      supervision_rate: 0.15,
    }),
  });
  if (!projectRes.ok) {
    fail("create project", `${projectRes.status} ${(await projectRes.text()).slice(0, 160)}`);
    throw new Error("cannot continue without a project");
  }
  const [project] = await projectRes.json();
  ok(`project created and linked (${project.code})`);

  await api("expenses", {
    method: "POST",
    body: JSON.stringify({
      project_id: project.id,
      date: "2026-01-10",
      item_ar: "بند اختبار",
      amount: 1000,
    }),
  });
  await api("payments", {
    method: "POST",
    body: JSON.stringify({
      project_id: project.id,
      date: "2026-01-11",
      label_ar: "دفعة اختبار",
      amount: 500,
    }),
  });

  // -------------------------------------------------- 2. access while active
  console.log("\nbefore archiving");

  const activeLookup = await credentialLookup(project.code, PHONE_TYPED);
  if (activeLookup === project.id) ok("code + phone resolves the project");
  else fail("code + phone resolves the project", String(activeLookup));

  const activeDash = await dashboardReachable(project.id);
  if (activeDash.status === 200 && activeDash.showsProject) ok("portal dashboard renders");
  else fail("portal dashboard renders", `status ${activeDash.status}`);

  // -------------------------------------------------------------- 3. archive
  console.log("\narchiving");

  const archiveRes = await api(`clients?id=eq.${clientId}`, {
    method: "PATCH",
    body: JSON.stringify({ archived_at: new Date().toISOString() }),
  });
  if (archiveRes.ok) ok("client archived");
  else fail("client archived", String(archiveRes.status));

  const activeList = await (await api("clients?archived_at=is.null&select=id")).json();
  if (!activeList.some((row) => row.id === clientId)) ok("hidden from the active admin list");
  else fail("hidden from the active admin list", "still present");

  const allList = await (await api("clients?select=id,name,phone")).json();
  const stillThere = allList.find((row) => row.id === clientId);
  if (stillThere && stillThere.name === NAME && stillThere.phone === PHONE_STORED) {
    ok("record itself untouched");
  } else {
    fail("record itself untouched", JSON.stringify(stillThere));
  }

  // ------------------------------------------- 4. access AFTER archiving
  console.log("\nafter archiving — the requirement");

  const archivedLookup = await credentialLookup(project.code, PHONE_TYPED);
  if (archivedLookup === project.id) ok("code + phone STILL resolves the project");
  else fail("code + phone STILL resolves the project", String(archivedLookup));

  const archivedDash = await dashboardReachable(project.id);
  if (archivedDash.status === 200 && archivedDash.showsProject) {
    ok("portal dashboard STILL renders");
  } else {
    fail(
      "portal dashboard STILL renders",
      archivedDash.status === 0 ? "dev server unreachable" : `status ${archivedDash.status}`,
    );
  }

  // ------------------- 5. portal access, a separate decision from archiving
  //
  // The client is STILL ARCHIVED here, which is the point: closing the portal
  // must refuse for its own reason, and reopening it must work again without
  // touching the archive flag. If the two were ever wired together, one of
  // these three would fail.
  //
  // The dashboard is the evidence because it runs the app's real code path
  // (getPortalData). That the login reports "disabled" *distinctly* from bad
  // credentials, and only after the phone matches, is asserted at source level
  // in src/lib/portalAccess.test.ts.
  console.log("\nportal access — independent of archiving");

  const setAccess = (enabled) =>
    api(`projects?id=eq.${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({ portal_access_enabled: enabled }),
    });

  await setAccess(false);

  const closedDash = await dashboardReachable(project.id);
  if (closedDash.status !== 200 || !closedDash.showsProject) {
    ok("closing the portal locks an EXISTING session out immediately");
  } else {
    fail("closing the portal locks an EXISTING session out immediately", "dashboard still rendered");
  }

  // Archived and closed: the credential pair still resolves, so any refusal is
  // the access flag talking, never the archive.
  const closedLookup = await credentialLookup(project.code, PHONE_TYPED);
  if (closedLookup === project.id) ok("credentials still resolve — the refusal is the flag, not the archive");
  else fail("credentials still resolve", String(closedLookup));

  /*
   * Regression guard for a real bug.
   *
   * The dashboard sends a revoked client to /track, and /track used to send any
   * session holder straight back to the dashboard. Closing a portal therefore
   * bounced a live session between the two until the browser gave up with
   * ERR_TOO_MANY_REDIRECTS. Following the redirects here — rather than checking
   * one hop with redirect:"manual" — is what catches it.
   */
  const followed = await fetch(`${site}/ar/track/dashboard`, {
    headers: { cookie: portalCookie(project.id) },
    redirect: "follow",
  }).catch((error) => ({ status: 0, error }));

  if (followed.status === 200) ok("a revoked session settles on the login page, no redirect loop");
  else fail("a revoked session settles on the login page", `status ${followed.status}`);

  await setAccess(true);

  const reopenedDash = await dashboardReachable(project.id);
  if (reopenedDash.status === 200 && reopenedDash.showsProject) {
    ok("reopening restores access while the client stays archived");
  } else {
    fail("reopening restores access while the client stays archived", `status ${reopenedDash.status}`);
  }

  // ---------------------------------------------------- 6. data intact
  console.log("\nproject data intact");

  const expenses = await (await api(`expenses?project_id=eq.${project.id}&select=amount`)).json();
  const payments = await (await api(`payments?project_id=eq.${project.id}&select=amount`)).json();
  const stillLinked = await (
    await api(`projects?id=eq.${project.id}&select=client_id,clients(name)`)
  ).json();

  if (expenses.length === 1 && payments.length === 1) ok("ledger rows preserved");
  else fail("ledger rows preserved", `${expenses.length} expenses, ${payments.length} payments`);

  const linked = stillLinked[0];
  const linkedClient = Array.isArray(linked?.clients) ? linked.clients[0] : linked?.clients;
  if (linked?.client_id === clientId && linkedClient?.name === NAME) ok("project still linked");
  else fail("project still linked", JSON.stringify(linked));

  // ---------------------------------------------------------- 7. restore
  console.log("\nrestore");

  await api(`clients?id=eq.${clientId}`, {
    method: "PATCH",
    body: JSON.stringify({ archived_at: null }),
  });
  const restored = await (await api("clients?archived_at=is.null&select=id")).json();
  if (restored.some((row) => row.id === clientId)) ok("restored to the active list");
  else fail("restored to the active list");
} catch (error) {
  fail("run", error.message);
} finally {
  await cleanup();
  console.log("\n  fixture removed");
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
