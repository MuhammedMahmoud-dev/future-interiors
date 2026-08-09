import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The admin form asks for what something reads, and nothing else.
 *
 * These are source-level guards on the outcome of an audit: every field was
 * traced through the public pages, the client portal, the printed statement and
 * the leak barrier, and the ones nothing read were either dropped or folded
 * away. That result is easy to undo by accident — a field is cheap to add back
 * and there is no failing behaviour to notice when someone does.
 *
 * The important half is the second group: hidden must not mean dropped. A
 * collapsed field that stops being written would destroy the engineer's data
 * silently, on an ordinary save, with nothing on screen to show it happened.
 */

const FORM = readFileSync("src/components/admin/ProjectForm.tsx", "utf8");
const MEDIA = readFileSync("src/components/admin/MediaManager.tsx", "utf8");
const ACTIONS = readFileSync("src/app/admin/projects/actions.ts", "utf8");

/** Fields nothing reads, kept only as the engineer's own reference. */
const COLLAPSED = [
  "unit_no",
  "building_no",
  "compound",
  "district",
  "area_m2",
  "start_date",
  "end_date",
];

test("the form no longer asks for the two descriptions", () => {
  for (const field of ["description_ar", "description_en"]) {
    assert.doesNotMatch(FORM, new RegExp(`name="${field}"`), `${field} is back on the form`);
  }
});

test("the photo row no longer offers a phase", () => {
  assert.doesNotMatch(MEDIA, /PHASES/, "the phase list is back in MediaManager");
  assert.doesNotMatch(MEDIA, /item\.phase/, "the phase select is back in MediaManager");
  assert.doesNotMatch(ACTIONS, /"phase" in patch/, "updateMedia accepts a phase again");
});

test("every collapsed field sits inside the details block", () => {
  const start = FORM.indexOf("<details");
  const end = FORM.indexOf("</details>");
  assert.ok(start !== -1 && end > start, "the details block is gone from ProjectForm");
  const inside = FORM.slice(start, end);

  for (const field of COLLAPSED) {
    assert.match(inside, new RegExp(`name="${field}"`), `${field} is not inside the details block`);
  }
});

test("nothing that IS read got folded away with them", () => {
  const inside = FORM.slice(FORM.indexOf("<details"), FORM.indexOf("</details>"));
  for (const field of ["title_ar", "title_en", "status", "supervision_rate"]) {
    assert.doesNotMatch(
      inside,
      new RegExp(`name="${field}"`),
      `${field} is read somewhere and must stay visible`,
    );
  }
});

/**
 * The one that matters. A closed <details> keeps its inputs in the DOM and
 * submits them, so collapsing is safe — but only for as long as the payload
 * still writes them.
 */
test("collapsing did not stop the fields being saved", () => {
  const start = ACTIONS.indexOf("function projectPayload");
  const body = ACTIONS.slice(start, ACTIONS.indexOf("\n/**", start));

  for (const field of COLLAPSED) {
    assert.match(body, new RegExp(`${field}:`), `projectPayload no longer writes ${field}`);
  }
});

/**
 * Descriptions are omitted from the payload rather than written as null. A row
 * that already carries one keeps it; only the form stopped asking.
 */
test("the removed descriptions are not overwritten with null", () => {
  const start = ACTIONS.indexOf("function projectPayload");
  const body = ACTIONS.slice(start, ACTIONS.indexOf("\n/**", start));
  for (const field of ["description_ar", "description_en"]) {
    assert.doesNotMatch(
      body,
      new RegExp(`^\\s+${field}:`, "m"),
      `${field} is written by projectPayload — an edit would erase existing text`,
    );
  }
});

test("the admin gets its own type scale, and the ledger opts back down", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const layout = readFileSync("src/app/admin/layout.tsx", "utf8");
  const ledger = readFileSync("src/components/admin/LedgerGrid.tsx", "utf8");

  assert.match(css, /\.type-scale-admin\s*\{/, "the admin scale is missing from globals.css");
  assert.match(layout, /type-scale-admin/, "the admin layout does not apply the scale");
  assert.match(css, /\.type-scale-admin \.ledger-dense/, "the ledger override is missing");
  assert.match(ledger, /ledger-dense/, "the ledger table does not claim the override");
});

test("the leads nav entry is gone but the route still answers", () => {
  const shell = readFileSync("src/components/admin/AdminShell.tsx", "utf8");
  assert.doesNotMatch(shell, /href: "\/admin\/leads"/, "the leads nav entry is back");
  // The page itself must survive — removal was from the nav only.
  assert.doesNotThrow(() => readFileSync("src/app/admin/leads/page.tsx", "utf8"));
});
