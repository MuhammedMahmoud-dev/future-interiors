import { test } from "node:test";
import assert from "node:assert/strict";
import { addMoney, computeStatement, sumAmounts, formatMoney, parseAmount } from "./finance.ts";
import { PUBLIC_PROJECT_COLUMNS, PRIVATE_PROJECT_FIELDS } from "./publicFields.ts";

test("mandatory acceptance test from the spec", () => {
  // One expense standing in for the real ledger; only the total matters here.
  const statement = computeStatement([{ amount: 893004 }], [{ amount: 1060000 }], 0.15);

  assert.equal(statement.total_cost, 893004);
  assert.equal(statement.supervision_fee, 133951);
  assert.equal(statement.grand_total, 1026955);
  assert.equal(statement.total_payments, 1060000);
  assert.equal(statement.balance, 33045);
});

test("postgres numeric strings add up instead of concatenating", () => {
  // The bug this guards: ["100","-20"].reduce((a,b)=>a+b,0) === "0100-20"
  assert.equal(sumAmounts([{ amount: "100.50" }, { amount: "-20.25" }, { amount: "893004" }]), 893084.25);
});

test("negative expenses are discounts, not errors", () => {
  const statement = computeStatement([{ amount: 1000 }, { amount: -200 }], [], 0.15);
  assert.equal(statement.total_cost, 800);
  assert.equal(statement.supervision_fee, 120);
  assert.equal(statement.balance, -920);
});

test("empty project does not produce NaN", () => {
  assert.deepEqual(computeStatement([], [], 0.15), {
    total_cost: 0,
    supervision_fee: 0,
    grand_total: 0,
    total_payments: 0,
    balance: 0,
  });
});

test("garbage amounts throw instead of silently becoming NaN", () => {
  assert.throws(() => sumAmounts([{ amount: "not a number" }]), /non-numeric amount/);
  assert.throws(() => computeStatement([], [], 1.5), /rate out of range/);
});

test("the supervision rate never appears in the returned statement", () => {
  const statement = computeStatement([{ amount: 1000 }], [], 0.15);
  assert.equal(Object.values(statement).includes(0.15), false);
  assert.equal("supervision_rate" in statement, false);
});

test("pasted amounts survive real-world Excel formatting", () => {
  assert.equal(parseAmount("1200"), 1200);
  assert.equal(parseAmount("1,200"), 1200);
  assert.equal(parseAmount("1,200.50"), 1200.5);
  assert.equal(parseAmount(" 893004 "), 893004);
  assert.equal(parseAmount("1200 ج.م"), 1200);
  assert.equal(parseAmount(-250), -250);
});

test("accounting-style parentheses mean a negative amount", () => {
  // Excel exports a discount as (500), not -500. Reading that as +500 would
  // overstate the client's cost.
  assert.equal(parseAmount("(500)"), -500);
  assert.equal(parseAmount("(1,250.75)"), -1250.75);
  assert.equal(parseAmount("-500"), -500);
});

test("arabic-indic digits parse as numbers", () => {
  assert.equal(parseAmount("١٢٠٠"), 1200);
  assert.equal(parseAmount("٨٩٣٠٠٤"), 893004);
  assert.equal(parseAmount("١٢٠٠٫٥"), 1200.5);
  assert.equal(parseAmount("۱۲۰۰"), 1200);
});

test("unparseable amounts return null rather than NaN", () => {
  for (const bad of ["", "   ", "abc", "-", "ج.م", null, undefined, "()"]) {
    assert.equal(parseAmount(bad), null, JSON.stringify(bad));
  }
});

test("money formats with western digits and separators", () => {
  assert.equal(formatMoney(1026955), "1,026,955");
  assert.equal(formatMoney(-33045.5), "-33,045.5");
});

test("public project column allowlist leaks nothing private", () => {
  const selected = PUBLIC_PROJECT_COLUMNS.split(",").map((c) => c.trim());
  for (const field of PRIVATE_PROJECT_FIELDS) {
    assert.equal(selected.includes(field), false, `${field} must never be selected publicly`);
  }
});

test("decimal amounts add up exactly, without float drift", () => {
  assert.equal(sumAmounts([{ amount: "0.1" }, { amount: "0.2" }]), 0.3);
  assert.equal(addMoney([0.1, 0.2]), 0.3);

  // A long ledger of piastre amounts must still land on an exact figure.
  const rows = Array.from({ length: 1000 }, () => ({ amount: "19.99" }));
  assert.equal(sumAmounts(rows), 19990);
});

test("a fully paid project shows a balance of exactly zero", () => {
  const statement = computeStatement(
    [{ amount: "1000.10" }, { amount: "2000.20" }],
    [{ amount: "3450.30" }],
    0.15,
  );
  assert.equal(statement.total_cost, 3000.3);
  assert.equal(statement.supervision_fee, 450);
  assert.equal(statement.grand_total, 3450.3);
  assert.equal(statement.balance, 0);
});

test("the fee rounds half away from zero, symmetrically for net credits", () => {
  // 10 x 0.05 = 0.5 pound -> 1; a net-credit ledger of -10 -> -1, not -0.
  assert.equal(computeStatement([{ amount: 10 }], [], 0.05).supervision_fee, 1);
  assert.equal(computeStatement([{ amount: -10 }], [], 0.05).supervision_fee, -1);
  assert.equal(Object.is(computeStatement([{ amount: 1 }, { amount: -1 }], [], 0.15).supervision_fee, -0), false);
});

test("a four-decimal supervision rate is applied exactly", () => {
  // 0.1275 is not exact in binary; 100,000 x 0.1275 must still be 12,750.
  assert.equal(computeStatement([{ amount: 100000 }], [], "0.1275").supervision_fee, 12750);
});
