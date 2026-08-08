/**
 * Creates (or removes) a throwaway project whose ledger sums to the spec's
 * mandatory acceptance case, so the portal can be exercised end to end against
 * real data:
 *
 *   893,004  ->  133,951  ->  1,026,955  vs  1,060,000  ->  +33,045
 *
 *   node --env-file=.env.local scripts/portal-fixture.mjs seed
 *   node --env-file=.env.local scripts/portal-fixture.mjs cleanup
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SLUG = "zz-portal-fixture";
const PHONE = "01012345678";

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

const EXPENSES = [
  { date: "2025-01-15", item_ar: "تأسيس كهرباء وسباكة", amount: 400000 },
  { date: "2025-02-20", item_ar: "محارة وأرضيات", amount: 250000 },
  { date: "2025-03-18", item_ar: "سيراميك ورخام", amount: 150000 },
  { date: "2025-04-22", item_ar: "دهانات", amount: 100000 },
  { date: "2025-05-05", item_ar: "خصم مرتجع مورد", amount: -6996 },
];

const PAYMENTS = [
  { date: "2025-01-10", label_ar: "دفعة أولى", amount: 500000, seq: 1 },
  { date: "2025-03-01", label_ar: "دفعة ثانية", amount: 300000, seq: 2 },
  { date: "2025-05-01", label_ar: "دفعة ثالثة", amount: 260000, seq: 3 },
];

/** The client is its own record now; reuse it across reseeds. */
async function ensureClient() {
  const stored = PHONE.replace(/\D/g, "").replace(/^0+/, "");
  const found = await (await api(`clients?phone=eq.${stored}&select=id`)).json();
  if (found[0]) return found[0].id;

  const res = await api("clients", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ name: "عميل الاختبار", phone: stored }),
  });
  const [row] = await res.json();
  return row.id;
}

async function findFixture() {
  const res = await api(`projects?slug=eq.${SLUG}&select=id,code`);
  const rows = res.ok ? await res.json() : [];
  return rows[0] ?? null;
}

async function cleanup() {
  const existing = await findFixture();
  if (existing) {
    // expenses/payments cascade on delete
    await api(`projects?id=eq.${existing.id}`, { method: "DELETE" });
    await api(`login_attempts?code=eq.${existing.code}`, { method: "DELETE" });
    console.log(`removed fixture ${existing.code}`);
  }

  /*
   * The client too, which this used to leave behind "to reuse across reseeds".
   * That was a false economy: ensureClient() already finds or creates it, so
   * nothing was saved, and the orphan sat in the database looking like real
   * data after every other trace of the fixture was gone.
   *
   * Only ever after the project, and only when nothing references it — the FK
   * is ON DELETE RESTRICT precisely so a ledger cannot lose its owner.
   */
  const stored = PHONE.replace(/\D/g, "").replace(/^0+/, "");
  const [client] = await (await api(`clients?phone=eq.${stored}&select=id`)).json();
  if (!client) return;

  const refs = await (await api(`projects?client_id=eq.${client.id}&select=id`)).json();
  if (refs.length > 0) {
    console.log(`client kept — ${refs.length} project(s) still reference it`);
    return;
  }

  await api(`clients?id=eq.${client.id}`, { method: "DELETE" });
  console.log("removed fixture client");
}

async function seed() {
  await cleanup();

  const res = await api("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      slug: SLUG,
      title_ar: "شقة 200م - كمبوند تجريبي",
      title_en: "200 sqm apartment - test compound",
      description_ar: "مشروع تجريبي لاختبار بوابة المتابعة.",
      client_id: await ensureClient(),
      unit_no: "13",
      building_no: "B7",
      supervision_rate: 0.15,
      compound: "كمبوند تجريبي",
      district: "الشيخ زايد",
      area_m2: 200,
      start_date: "2025-01-01",
      end_date: "2025-06-01",
      status: "in_progress",
      is_public: false,
    }),
  });

  if (!res.ok) {
    console.error("insert failed", res.status, await res.text());
    process.exit(1);
  }

  const [project] = await res.json();

  await api("expenses", {
    method: "POST",
    body: JSON.stringify(EXPENSES.map((row, i) => ({ ...row, project_id: project.id, sort_order: i }))),
  });
  await api("payments", {
    method: "POST",
    body: JSON.stringify(PAYMENTS.map((row) => ({ ...row, project_id: project.id }))),
  });

  // Mark two of the six stages done, so progress should read 33%.
  const stages = await (await api("stages?select=id,order_index&order=order_index")).json();
  await api("project_stages", {
    method: "POST",
    body: JSON.stringify(
      stages.map((stage, i) => ({
        project_id: project.id,
        stage_id: stage.id,
        status: i < 2 ? "done" : i === 2 ? "in_progress" : "not_started",
      })),
    ),
  });

  const expected = {
    total_cost: EXPENSES.reduce((s, e) => s + e.amount, 0),
    total_payments: PAYMENTS.reduce((s, p) => s + p.amount, 0),
  };
  expected.supervision_fee = Math.round(expected.total_cost * 0.15);
  expected.grand_total = expected.total_cost + expected.supervision_fee;
  expected.balance = expected.total_payments - expected.grand_total;

  console.log(JSON.stringify({ code: project.code, phone: PHONE, expected }, null, 2));
}

const command = process.argv[2];
if (command === "seed") await seed();
else if (command === "cleanup") await cleanup();
else {
  console.error("usage: portal-fixture.mjs seed|cleanup");
  process.exit(1);
}
