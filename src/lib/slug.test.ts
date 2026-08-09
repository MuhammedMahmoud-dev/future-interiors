import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { firstFreeSlug, slugFromCode } from "./slug.ts";

test("a project code becomes its slug", () => {
  assert.equal(slugFromCode("FI-HK-XSVR"), "fi-hk-xsvr");
  assert.equal(slugFromCode("  FI-2U-HQRH  "), "fi-2u-hqrh");
});

/*
 * gen_project_code() emits FI-XX-XXXX from an uppercase alphanumeric alphabet,
 * so lowercasing is the whole transformation and the result is always a legal
 * slug. This is the property that makes the field impossible to fail on — if a
 * code could ever contain a space or an Arabic letter, it would not hold.
 */
test("the derived slug is always URL-safe", () => {
  for (const code of ["FI-AB-1234", "FI-Z9-EZ7Q", "FI-00-0000"]) {
    assert.match(slugFromCode(code), /^[a-z0-9-]+$/);
  }
});

test("a free slug is used as-is", () => {
  assert.equal(firstFreeSlug("fi-hk-xsvr", []), "fi-hk-xsvr");
  assert.equal(firstFreeSlug("fi-hk-xsvr", ["fi-ab-1234", "gallery-01"]), "fi-hk-xsvr");
});

test("a taken slug is numbered rather than rejected", () => {
  assert.equal(firstFreeSlug("fi-hk-xsvr", ["fi-hk-xsvr"]), "fi-hk-xsvr-2");
  assert.equal(firstFreeSlug("fi-hk-xsvr", ["fi-hk-xsvr", "fi-hk-xsvr-2"]), "fi-hk-xsvr-3");
});

test("numbering skips gaps rather than reusing them", () => {
  // -2 is free even though -3 is taken; taking the first free number keeps the
  // sequence dense instead of climbing forever.
  assert.equal(firstFreeSlug("a", ["a", "a-3"]), "a-2");
});

test("unrelated slugs sharing the prefix do not push the number up", () => {
  assert.equal(firstFreeSlug("a", ["a-2", "a-3"]), "a");
});

/*
 * The point of the whole change: there is no input to reject, so the save path
 * has no way to refuse a name. If a validation branch ever comes back into the
 * project payload, this fails.
 */
test("the project form no longer collects or validates a slug", () => {
  const form = readFileSync("src/components/admin/ProjectForm.tsx", "utf8");
  assert.doesNotMatch(form, /name="slug"/, "the form still has a slug input");

  const actions = readFileSync("src/app/admin/projects/actions.ts", "utf8");
  const start = actions.indexOf("function projectPayload");
  const body = actions.slice(start, actions.indexOf("\nexport ", start));
  assert.doesNotMatch(body, /formData\.get\("slug"\)/, "the payload still reads a slug field");
});

/*
 * Nothing may resolve a project by slug. The column still exists and is still
 * unique, but it addresses nothing — that is what makes deriving it safe.
 */
test("no route or query looks a project up by slug", () => {
  // The declaration, not the bare name — the comment marking its removal says
  // getProjectBySlug too, and a test that trips over its own tombstone is not
  // testing anything.
  const data = readFileSync("src/lib/data.ts", "utf8");
  assert.doesNotMatch(data, /function getProjectBySlug/, "a slug lookup is back in data.ts");
  assert.doesNotMatch(data, /\.eq\("slug"/, "a public query filters on slug");
});
