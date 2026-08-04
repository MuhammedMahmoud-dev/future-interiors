/**
 * End-to-end privacy + schema check against the live Supabase project.
 *
 *   npm run verify           (dev server must be running for the leak grep)
 *
 * It does three things:
 *   1. confirms the migrations landed and the lookup seeds are present
 *   2. confirms RLS denies the publishable (anon) key on every table
 *   3. publishes a throwaway project stuffed with distinctive private values,
 *      greps every public page for them, then deletes it again
 *
 * Step 3 writes to the database. The row is removed in a finally block.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const site = process.env.SITE_URL ?? "http://localhost:3000";

if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const TABLES = [
  "projects", "clients", "expenses", "payments", "stages", "project_stages", "project_media",
  "services", "testimonials", "faqs", "site_stats", "engineer_profile", "leads",
  "login_attempts",
];

const SEEDS = { stages: 6, services: 6, faqs: 7 };

// Distinctive so a grep hit cannot be a coincidence.
const PROBE = {
  slug: "zz-privacy-probe",
  title_ar: "مشروع فحص الخصوصية",
  unit_no: "UNITNO-ZZ9",
  building_no: "BLDGNO-ZZ9",
  supervision_rate: 0.1337,
};

// The client's name and number moved to their own table; they must stay just as
// absent from public HTML as when they were columns on the project.
const PROBE_CLIENT = {
  name: "CLIENTNAME-ZZ9",
  phone: "1099999999",
};

const api = (path, key, init = {}) =>
  fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers },
  });

let failures = 0;
const ok = (name) => console.log(`  PASS  ${name}`);
const fail = (name, detail) => {
  failures++;
  console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
};

// ---------------------------------------------------------------- 1. schema

console.log("\nschema");
for (const table of TABLES) {
  const res = await api(`${table}?select=*&limit=1`, secret);
  if (res.ok) ok(table);
  else fail(table, `${res.status} ${(await res.text()).slice(0, 80)}`);
}

console.log("\nseeds");
for (const [table, expected] of Object.entries(SEEDS)) {
  const res = await api(`${table}?select=id`, secret, { headers: { Prefer: "count=exact" } });
  const rows = res.ok ? (await res.json()).length : -1;
  if (rows === expected) ok(`${table} = ${expected}`);
  else fail(table, `expected ${expected}, got ${rows}`);
}

// ---------------------------------------------------------------- 2. RLS

console.log("\nRLS denies the publishable key");
if (!publishable) {
  fail("publishable key", "NEXT_PUBLIC_SUPABASE_ANON_KEY not set, cannot test");
} else {
  for (const table of TABLES) {
    const res = await api(`${table}?select=*&limit=1`, publishable);
    const body = res.ok ? await res.json() : null;
    // Denied means either a hard error or an empty result — never rows.
    if (!res.ok || (Array.isArray(body) && body.length === 0)) ok(table);
    else fail(table, `returned ${body?.length} row(s) to anon`);
  }
}

// ---------------------------------------------------------------- 3. leak grep

console.log("\nprivate fields absent from public HTML");
let probeId = null;
let probeClientId = null;
try {
  const clientInsert = await api("clients", secret, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(PROBE_CLIENT),
  });
  if (clientInsert.ok) {
    [{ id: probeClientId }] = await clientInsert.json();
  } else {
    fail("insert probe client", `${clientInsert.status} ${(await clientInsert.text()).slice(0, 120)}`);
  }

  const insert = await api("projects", secret, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      ...PROBE,
      client_id: probeClientId,
      status: "completed",
      compound: "ZZ Compound",
      area_m2: 200,
      start_date: "2025-01-01",
      end_date: "2025-06-01",
      is_public: true,
      publish_approved_at: new Date().toISOString(),
    }),
  });

  if (!insert.ok) {
    fail("insert probe project", `${insert.status} ${(await insert.text()).slice(0, 120)}`);
  } else {
    const [row] = await insert.json();
    probeId = row.id;

    // The code column must auto-generate in the FI-XX-XXXX shape, no 0/O/1/I.
    if (/^FI-[2-9A-HJ-NP-Z]{2}-[2-9A-HJ-NP-Z]{4}$/.test(row.code)) {
      ok(`code auto-generated (${row.code})`);
    } else {
      fail("code format", row.code);
    }

    const reachable = await fetch(site).then((r) => r.ok).catch(() => false);
    if (!reachable) {
      fail("dev server", `not reachable at ${site} — run npm run dev, then re-run`);
    } else {
      const needles = [
        PROBE.unit_no, PROBE.building_no,
        PROBE_CLIENT.name, PROBE_CLIENT.phone, `0${PROBE_CLIENT.phone}`,
        "0.1337", "1337", "supervision_rate", "unit_no", "building_no", "client_id",
      ];
      const paths = ["/ar", "/en", "/ar/works", "/en/works", `/ar/works/${PROBE.slug}`, `/en/works/${PROBE.slug}`];

      for (const path of paths) {
        const res = await fetch(site + path);
        const html = await res.text();
        const hits = needles.filter((needle) => html.includes(needle));
        if (res.status !== 200) fail(path, `status ${res.status}`);
        else if (hits.length) fail(path, `leaked: ${hits.join(", ")}`);
        else ok(`${path} (${html.length} bytes, clean)`);
      }
    }
  }
} finally {
  // Project first: the client FK is ON DELETE RESTRICT by design.
  if (probeId) await api(`projects?id=eq.${probeId}`, secret, { method: "DELETE" });
  if (probeClientId) await api(`clients?id=eq.${probeClientId}`, secret, { method: "DELETE" });
  if (probeId) {
    const del = await api(`projects?id=eq.${probeId}`, secret, { method: "DELETE" });
    console.log(del.ok ? "\n  probe project deleted" : `\n  WARNING: probe ${probeId} NOT deleted`);
  }
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
