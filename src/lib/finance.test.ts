import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStatement, sumAmounts, formatMoney } from "./finance.ts";
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
