/**
 * Puts the works gallery back from `photos-source/`.
 *
 *   node --env-file=.env.local scripts/restore-gallery.mjs        # dry run
 *   node --env-file=.env.local scripts/restore-gallery.mjs apply
 *
 * Writes `gallery_images` rows — site content, owned by nothing.
 *
 * The first version of this script invented three fake projects to hang the
 * photographs from, because project_media was the only place a photo could
 * live. That is what let a project deletion empty the gallery, twice. There are
 * no projects here now, nothing is published or approved, and deleting every
 * project in the database would leave this untouched.
 *
 * hero.jpg and hero-mobile.jpg are committed files served from /public. This
 * script never touches them.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const APPLY = process.argv[2] === "apply";
const PHOTOS_DIR = path.join(process.cwd(), "photos-source");
const PREFIX = "gallery";

/**
 * 7.jpeg carried another studio's watermark ("… CREATIVE DESIGN") and was
 * removed from photos-source/ deliberately. If it ever reappears, stop — a
 * restore script quietly republishing someone else's mark is exactly the
 * accident worth failing loudly over.
 */
const BANNED = ["7.jpeg", "7.jpg", "7.png", "7.webp"];

const MIME = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const api = (route, init = {}) =>
  fetch(`${url}/rest/v1/${route}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

async function upload(objectPath, bytes) {
  const res = await fetch(`${url}/storage/v1/object/media/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": MIME[path.extname(objectPath).toLowerCase()] ?? "image/jpeg",
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!res.ok) throw new Error(`upload ${objectPath} failed: ${res.status} ${await res.text()}`);
  return objectPath;
}

async function listStored() {
  const res = await fetch(`${url}/storage/v1/object/list/media`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: PREFIX, limit: 1000 }),
  });
  const rows = res.ok ? await res.json() : [];
  return rows.map((row) => `${PREFIX}/${row.name}`);
}

// ------------------------------------------------------------------- plan

const files = readdirSync(PHOTOS_DIR)
  .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
  .sort();

const banned = files.filter((name) => BANNED.includes(name.toLowerCase()));
if (banned.length > 0) {
  console.error(`\nREFUSING: ${banned.join(", ")} carries another studio's watermark.`);
  console.error("Remove it from photos-source/ before restoring.\n");
  process.exit(1);
}

// hero.* is a committed file in /public, not gallery photography.
const gallery = files.filter((name) => !/^hero/i.test(name));

if (gallery.length === 0) {
  console.error("photos-source/ has no gallery photographs.");
  process.exit(1);
}

const sha = (name) =>
  createHash("sha256").update(readFileSync(path.join(PHOTOS_DIR, name))).digest("hex").slice(0, 12);

console.log(`\n${gallery.length} gallery photograph(s)\n`);
gallery.forEach((name, i) => {
  const object = `${PREFIX}/${String(i).padStart(2, "0")}-${name.toLowerCase()}`;
  console.log(`  ${String(i).padStart(2)}  ${name.padEnd(10)} ${sha(name)}  ->  ${object}`);
});

const distinct = new Set(gallery.map(sha));
console.log(
  `\n${distinct.size} distinct image(s) by content hash — ${
    distinct.size === gallery.length ? "no duplicates" : "DUPLICATES PRESENT"
  }`,
);

if (!APPLY) {
  console.log("\nDry run. Re-run with `apply` to upload.\n");
  process.exit(distinct.size === gallery.length ? 0 : 1);
}

if (distinct.size !== gallery.length) {
  console.error("\nRefusing to upload duplicates.\n");
  process.exit(1);
}

// ------------------------------------------------------------------ apply

console.log("\napplying");

/*
 * Clear the table and everything under gallery/ in storage, including objects
 * no row points at. Three such orphans were left behind by an earlier project
 * delete — it removed the media rows' objects but never the project cover —
 * and without this sweep they would sit in the bucket forever.
 */
const existingObjects = await listStored();
if (existingObjects.length > 0) {
  await fetch(`${url}/storage/v1/object/media`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: existingObjects }),
  });
  console.log(`  swept ${existingObjects.length} object(s) from storage`);
}

const wiped = await api("gallery_images?id=not.is.null", { method: "DELETE" });
if (!wiped.ok) {
  console.error(`  could not clear gallery_images: ${wiped.status} ${await wiped.text()}`);
  process.exit(1);
}

const rows = [];
for (const [index, name] of gallery.entries()) {
  const object = await upload(
    `${PREFIX}/${String(index).padStart(2, "0")}-${name.toLowerCase()}`,
    readFileSync(path.join(PHOTOS_DIR, name)),
  );
  rows.push({ url: object, sort_order: index, is_public: true });
}

const inserted = await api("gallery_images", { method: "POST", body: JSON.stringify(rows) });
if (!inserted.ok) {
  console.error(`  insert failed: ${inserted.status} ${await inserted.text()}`);
  process.exit(1);
}

const check = await (await api("gallery_images?select=id,url,sort_order&order=sort_order")).json();
console.log(`\n${rows.length} object(s) uploaded, ${check.length} row(s) in gallery_images.\n`);
