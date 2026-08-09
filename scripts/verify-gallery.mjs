/**
 * The guarantee this whole change exists for: nothing a project does can touch
 * the works gallery.
 *
 *   npm run verify:gallery      (dev server must be running)
 *
 * The gallery used to live in project_media, so deleting a project deleted the
 * photographs and their storage objects. It happened twice. The fix was to give
 * the gallery its own table with no foreign key to anything — and this proves
 * it by doing the exact thing that broke it before.
 *
 * The delete goes through the real deleteProject Server Action rather than a
 * SQL delete, because the bug was in that action's storage sweep. A raw delete
 * would pass this test while the real button still emptied the gallery.
 */

import { existsSync, readFileSync } from "node:fs";

import { createSessionToken } from "../src/lib/session.ts";

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
  failures += 1;
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

const cookie = `fi_admin=${createSessionToken(
  process.env.ADMIN_EMAIL ?? "eng@futureinteriors.test",
  sessionSecret,
  "admin",
  60 * 60,
)}`;

const MANIFEST_PATH = existsSync(".next/dev/server/server-reference-manifest.json")
  ? ".next/dev/server/server-reference-manifest.json"
  : ".next/server/server-reference-manifest.json";

function findActionId(exportName) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")).node;
  return (
    Object.entries(manifest).find(
      ([, v]) =>
        v.exportedName === exportName && v.filename === "src/app/admin/projects/actions.ts",
    )?.[0] ?? null
  );
}

/** Referenced entries first — the reply decoder reads the parts in order. */
function post(path, actionId, fields, bound = []) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(`_1_${k}`, v);
  body.set("0", JSON.stringify([...bound, null, "$K1"]));
  return fetch(site + path, {
    method: "POST",
    headers: { "Next-Action": actionId, cookie },
    body,
    redirect: "manual",
  });
}

function postArgs(path, actionId, args) {
  return fetch(site + path, {
    method: "POST",
    headers: { "Next-Action": actionId, "Content-Type": "text/plain;charset=UTF-8", cookie },
    body: JSON.stringify(args),
    redirect: "manual",
  });
}

const galleryUrls = async () =>
  (await (await api("gallery_images?select=url&order=sort_order")).json()).map((r) => r.url);

/** Every gallery object must still be fetchable, not merely still be a row. */
async function objectsAlive(paths) {
  const res = await fetch(`${url}/storage/v1/object/sign/media`, {
    method: "POST",
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paths, expiresIn: 300 }),
  });
  const signed = res.ok ? await res.json() : [];
  let alive = 0;
  for (const entry of signed) {
    const link = entry.signedURL ?? entry.signedUrl;
    if (!link) continue;
    const head = await fetch(`${url}/storage/v1${link}`, { method: "HEAD" });
    if (head.status === 200) alive += 1;
  }
  return alive;
}

const SLUG = "zz-gallery-probe";
let project = null;

try {
  console.log("\nbefore");
  const before = await galleryUrls();
  if (before.length === 0) {
    fail("gallery is empty", "restore it first — this test proves it SURVIVES, not that it exists");
    process.exit(1);
  }
  const beforeAlive = await objectsAlive(before);
  ok(`${before.length} gallery row(s), ${beforeAlive} object(s) fetchable`);

  // ------------------------------------------------ a project with its own photo

  await api(`projects?slug=eq.${SLUG}`, { method: "DELETE" });
  const created = await api("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      slug: SLUG,
      title_ar: "مشروع فحص المعرض",
      supervision_rate: 0.15,
      status: "in_progress",
    }),
  });
  [project] = await created.json();

  // A real storage object of its own, plus a cover — the two things the delete
  // sweep removes. If it ever over-reaches, it has something to over-reach into.
  const own = `${project.id}/probe.txt`;
  await fetch(`${url}/storage/v1/object/media/${own}`, {
    method: "POST",
    headers: { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "text/plain" },
    body: "probe",
  });
  await api("project_media", {
    method: "POST",
    body: JSON.stringify([{ project_id: project.id, url: own, type: "image", is_public: true }]),
  });
  await api(`projects?id=eq.${project.id}`, {
    method: "PATCH",
    body: JSON.stringify({ cover_image: own }),
  });
  ok(`probe project ${project.code} with 1 photo of its own`);

  const path = `/admin/projects/${project.id}`;
  await fetch(site + path, { headers: { cookie } });

  // ------------------------------------------------------------ archive first

  console.log("\narchiving a project");
  const archiveId = findActionId("setProjectArchived");
  await postArgs(path, archiveId, [project.id, true]);

  const afterArchive = await galleryUrls();
  if (afterArchive.length === before.length) ok(`gallery still ${afterArchive.length} row(s)`);
  else fail("archiving changed the gallery", `${before.length} -> ${afterArchive.length}`);

  await postArgs(path, archiveId, [project.id, false]);

  // ----------------------------------------------------------- then delete it

  console.log("\ndeleting a project — the exact thing that emptied the gallery twice");
  const deleteId = findActionId("deleteProject");
  const res = await post(path, deleteId, { id: project.id, confirm: project.code }, []);

  const gone = (await (await api(`projects?id=eq.${project.id}&select=id`)).json()).length === 0;
  if (gone) {
    ok("the project is gone");
    project = null;
  } else fail("delete", `project survived (${res.status})`);

  const after = await galleryUrls();
  if (after.length === before.length) ok(`gallery still ${after.length} row(s)`);
  else fail("THE BUG IS BACK", `gallery went ${before.length} -> ${after.length}`);

  const missing = before.filter((u) => !after.includes(u));
  if (missing.length === 0) ok("every gallery row is the same one as before");
  else fail("rows changed", missing.join(", "));

  const afterAlive = await objectsAlive(after);
  if (afterAlive === beforeAlive) ok(`all ${afterAlive} storage object(s) still fetchable`);
  else fail("storage objects destroyed", `${beforeAlive} -> ${afterAlive}`);

  /*
   * The project's own things must be gone — the sweep has to still work, or
   * this change would have traded a destroyed gallery for a bucket full of
   * orphans.
   *
   * Checked by fetching, not by whether the sign request succeeded: the batch
   * sign endpoint answers 200 for a missing path and reports the failure per
   * entry, so `res.ok` is true either way and an earlier version of this check
   * "failed" against storage that was in fact perfectly clean.
   */
  if ((await objectsAlive([own])) === 0) ok("the project's own object was removed with it");
  else fail("orphaned object", "the project's storage object outlived the project");
} finally {
  console.log("\ncleanup");
  const res = await api(`projects?slug=eq.${SLUG}`, { method: "DELETE" });
  console.log(`  probe: ${res.ok ? "removed" : `NOT removed (${res.status})`}`);
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
