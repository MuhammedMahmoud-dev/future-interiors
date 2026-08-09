import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The works gallery belongs to the site, not to a project.
 *
 * This guarantee lives in an *absence* — gallery_images has no project_id and
 * no foreign key — and absences are the easiest thing in a schema to undo by
 * accident. Someone adding "just a project_id, for convenience" would rebuild
 * the exact coupling that emptied the gallery twice, and nothing would fail
 * until a project was next deleted.
 *
 * The end-to-end proof, deleting a real project and re-counting, is
 * scripts/verify-gallery.mjs.
 */

const MIGRATION = readFileSync("supabase/migrations/0006_gallery_images.sql", "utf8");
const ACTIONS = readFileSync("src/app/admin/projects/actions.ts", "utf8");
const GALLERY_ACTIONS = readFileSync("src/app/admin/gallery/actions.ts", "utf8");

/**
 * Comments stripped before matching, everywhere in this file.
 *
 * Every one of these assertions is "this name must not appear", and the code
 * explaining *why* it must not appear naturally says the name out loud. Without
 * this the tests trip over their own documentation — which is a false failure,
 * and a false failure in a guard is how the guard gets deleted.
 */
const stripComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !/^\s*(--|\/\/)/.test(line))
    .join("\n");

const schema = stripComments(MIGRATION);

test("gallery_images has no link to projects", () => {
  assert.match(schema, /create table gallery_images/, "the table is gone");
  assert.doesNotMatch(schema, /project_id/, "gallery_images grew a project_id");
  assert.doesNotMatch(schema, /references/i, "gallery_images grew a foreign key");
});

test("the gallery keeps its own ordering and visibility", () => {
  for (const column of ["url", "sort_order", "is_public"]) {
    assert.match(schema, new RegExp(`\\b${column}\\b`), `${column} is missing from gallery_images`);
  }
});

/**
 * deleteProject sweeps storage by hand, because storage does not cascade. That
 * sweep is what destroyed the gallery: it must only ever collect paths it read
 * from this project's own rows.
 */
test("the project delete never names the gallery", () => {
  const start = ACTIONS.indexOf("export async function deleteProject");
  const body = stripComments(ACTIONS.slice(start, ACTIONS.indexOf("\nexport ", start + 1)));

  assert.doesNotMatch(body, /gallery_images/, "deleteProject reaches into gallery_images");
  assert.doesNotMatch(body, /"gallery\//, "deleteProject removes a gallery/ path");
  // What it SHOULD sweep: its own media, and its own cover.
  assert.match(body, /from\("project_media"\)/, "deleteProject stopped sweeping project media");
  assert.match(body, /cover_image/, "deleteProject stopped sweeping the cover — orphans again");
});

/** And the reverse: the gallery's own actions must not reach into projects. */
test("the gallery actions never touch projects", () => {
  const source = stripComments(GALLERY_ACTIONS);
  assert.doesNotMatch(source, /from\("projects"\)/, "a gallery action reads projects");
  assert.doesNotMatch(source, /from\("project_media"\)/, "a gallery action reads project_media");
});

test("every gallery action authenticates before touching the database", () => {
  const names = [
    "uploadGalleryImages",
    "updateGalleryImage",
    "deleteGalleryImage",
    "moveGalleryImage",
  ];

  for (const name of names) {
    const start = GALLERY_ACTIONS.indexOf(`export async function ${name}`);
    assert.notEqual(start, -1, `${name} is missing`);
    const rest = GALLERY_ACTIONS.slice(start + 1);
    const next = rest.indexOf("\nexport ");
    const body = next === -1 ? rest : rest.slice(0, next);

    const guarded = body.indexOf("requireAdmin()");
    const db = body.indexOf("requireDb()");
    assert.notEqual(guarded, -1, `${name} does not call requireAdmin`);
    assert.ok(guarded < db, `${name} must call requireAdmin before requireDb`);
  }
});

/**
 * The public pages must read the gallery table, not projects. If either page
 * goes back to project media, deleting a project empties it again.
 */
test("the public pages read the gallery table", () => {
  for (const page of ["src/app/[locale]/works/page.tsx", "src/app/[locale]/page.tsx"]) {
    const source = readFileSync(page, "utf8");
    assert.match(source, /getGalleryImages/, `${page} does not read the gallery table`);
    assert.doesNotMatch(
      source,
      /getPublicProjectMedia\(/,
      `${page} still reads photographs out of project media`,
    );
  }
});

/** The gallery allowlist exists for the same reason every other one does. */
test("gallery reads go through the column allowlist", () => {
  const data = readFileSync("src/lib/data.ts", "utf8");
  const start = data.indexOf("export async function getGalleryImages");
  const body = data.slice(start, data.indexOf("\n}", start));

  assert.match(body, /PUBLIC_GALLERY_COLUMNS/, "getGalleryImages does not use the allowlist");
  assert.doesNotMatch(body, /select\("\*"\)/, "getGalleryImages selects everything");
});
