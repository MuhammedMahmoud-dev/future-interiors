import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDateInput, durationMonths, yearOf, locationLabel } from "./format.ts";

test("iso dates pass through", () => {
  assert.equal(parseDateInput("2026-08-03"), "2026-08-03");
  assert.equal(parseDateInput("2026-8-3"), "2026-08-03");
});

test("slash dates are read day-first, as Egyptian Excel writes them", () => {
  // 03/08/2026 is 3 August, not 8 March. Month-first would misdate the statement.
  assert.equal(parseDateInput("03/08/2026"), "2026-08-03");
  assert.equal(parseDateInput("3/8/2026"), "2026-08-03");
  assert.equal(parseDateInput("15/01/2025"), "2025-01-15");
  assert.equal(parseDateInput("31.12.2025"), "2025-12-31");
  assert.equal(parseDateInput("01-02-2025"), "2025-02-01");
});

test("two-digit years resolve to this century", () => {
  assert.equal(parseDateInput("03/08/26"), "2026-08-03");
  assert.equal(parseDateInput("03/08/99"), "1999-08-03");
});

test("arabic-indic digits parse", () => {
  assert.equal(parseDateInput("٢٠٢٦-٠٨-٠٣"), "2026-08-03");
});

test("impossible dates are rejected rather than rolled over", () => {
  // new Date(2025, 1, 31) silently becomes 3 March — that must not happen.
  for (const bad of ["31/02/2025", "2025-02-30", "45/01/2025", "01/13/2025", "", "abc", null]) {
    assert.equal(parseDateInput(bad), null, String(bad));
  }
});

test("duration is whole months, never below one", () => {
  assert.equal(durationMonths("2025-01-01", "2025-07-01"), 6);
  assert.equal(durationMonths("2025-01-01", "2025-01-05"), 1);
  assert.equal(durationMonths("2025-07-01", "2025-01-01"), null);
  assert.equal(durationMonths(null, "2025-01-01"), null);
});

test("year and location helpers degrade quietly", () => {
  assert.equal(yearOf("2025-06-01"), "2025");
  assert.equal(yearOf(null), null);
  assert.equal(locationLabel("كالما", "الشيخ زايد", "ar"), "كالما، الشيخ زايد");
  assert.equal(locationLabel("Kalma", null, "en"), "Kalma");
  assert.equal(locationLabel(null, null, "ar"), "");
});
