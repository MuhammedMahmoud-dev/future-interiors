/**
 * Puts the works gallery back from `photos-source/`.
 *
 *   node --env-file=.env.local scripts/restore-gallery.mjs        # dry run
 *   node --env-file=.env.local scripts/restore-gallery.mjs apply
 *
 * The photographs live on Supabase Storage and the rows that point at them live
 * in the database; both were cleared with the seed data. The originals are
 * still on this machine, so this uploads them again under the same distribution
 * rule the seed used, and reproduces the grouping and order recorded in
 * backups/2026-08-07/.
 *
 * What it deliberately does NOT restore: clients, expenses, payments, leads and
 * the rest of the seeded fiction. Those were deleted on purpose. This creates
 * only what the gallery reads — published, completed projects carrying photos —
 * and no financial record at all.
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

/*
 * A separate namespace from the seed's `zz-preview`, on purpose.
 *
 * `zz-` is the throwaway prefix: seed-dev-preview.mjs wipes `zz-preview*` on
 * every run and the verification scripts delete their own `zz-` rows. Restoring
 * the gallery into that namespace would mean the next seed silently erases it
 * again. These photographs are the real portfolio, so they get a real prefix.
 */
const TAG = "gallery";

/**
 * 7.jpeg carried another studio's watermark ("… CREATIVE DESIGN") and was
 * removed from photos-source/ deliberately. If it ever reappears, stop — a
 * restore script quietly republishing someone else's mark is exactly the
 * accident worth failing loudly over.
 */
const BANNED = ["7.jpeg", "7.jpg", "7.png", "7.webp"];

const MIME = { ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

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

/*
 * The three projects, with the publish dates from the backup.
 *
 * Those dates are not decoration: getPublishedProjects orders by
 * publish_approved_at descending, so they are what puts the gallery back in the
 * order it was in rather than an arbitrary one.
 */
const PROJECTS = [
  { slug: `${TAG}-01`, title_ar: "شقة 200م", title_en: "200 sqm apartment", area_m2: 200, approved: "2025-01-12T00:00:00+00:00" },
  { slug: `${TAG}-02`, title_ar: "شقة 165م", title_en: "165 sqm apartment", area_m2: 165, approved: "2025-02-12T00:00:00+00:00" },
  { slug: `${TAG}-03`, title_ar: "شقة 240م", title_en: "240 sqm apartment", area_m2: 240, approved: "2025-03-12T00:00:00+00:00" },
];

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

/*
 * The seed's rule, unchanged: contiguous chunks so consecutively-named shots
 * stay together, and every file used exactly once. The first of each chunk
 * becomes the cover and leads that project's run in the gallery.
 */
const wanted = Math.min(PROJECTS.length, gallery.length);
const per = Math.ceil(gallery.length / wanted);
const chunks = Array.from({ length: wanted }, (_, i) =>
  gallery.slice(i * per, (i + 1) * per),
).filter((chunk) => chunk.length > 0);

const sha = (name) =>
  createHash("sha256").update(readFileSync(path.join(PHOTOS_DIR, name))).digest("hex").slice(0, 12);

console.log(`\n${gallery.length} gallery photograph(s), ${chunks.length} project(s)\n`);
chunks.forEach((chunk, i) => {
  const spec = PROJECTS[i];
  console.log(`${spec.slug}  (published ${spec.approved.slice(0, 10)})`);
  chunk.forEach((name, j) => {
    const object = j === 0 ? `${TAG}/${spec.slug}-cover` : `${TAG}/${spec.slug}-${j - 1}`;
    console.log(`   ${j === 0 ? "cover" : `#${j - 1}  `}  ${name.padEnd(10)} ${sha(name)}  ->  ${object}${path.extname(name).toLowerCase()}`);
  });
});

const distinct = new Set(gallery.map(sha));
console.log(`\n${distinct.size} distinct image(s) by content hash — ${distinct.size === gallery.length ? "no duplicates" : "DUPLICATES PRESENT"}`);

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

// Idempotent: clear a previous run of THIS script only. Media rows cascade.
const existing = await (await api(`projects?slug=like.${TAG}-*&select=id,slug`)).json();
if (existing.length > 0) {
  const objects = await (
    await api(`project_media?project_id=in.(${existing.map((p) => p.id).join(",")})&select=url`)
  ).json();
  const covers = existing.map((p) => `${TAG}/${p.slug}-cover.jpeg`);
  await fetch(`${url}/storage/v1/object/media`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [...objects.map((o) => o.url), ...covers] }),
  });
  await api(`projects?slug=like.${TAG}-*`, { method: "DELETE" });
  console.log(`  cleared ${existing.length} previous project(s)`);
}

let uploaded = 0;

for (const [index, chunk] of chunks.entries()) {
  const spec = PROJECTS[index];
  const ext = path.extname(chunk[0]).toLowerCase();

  const cover = await upload(
    `${TAG}/${spec.slug}-cover${ext}`,
    readFileSync(path.join(PHOTOS_DIR, chunk[0])),
  );
  uploaded += 1;

  const res = await api("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      slug: spec.slug,
      title_ar: spec.title_ar,
      title_en: spec.title_en,
      area_m2: spec.area_m2,
      status: "completed",
      cover_image: cover,
      is_public: true,
      publish_approved_at: spec.approved,
    }),
  });
  if (!res.ok) throw new Error(`insert ${spec.slug}: ${res.status} ${await res.text()}`);
  const [project] = await res.json();

  const rows = [];
  for (const [i, name] of chunk.slice(1).entries()) {
    const object = await upload(
      `${TAG}/${spec.slug}-${i}${path.extname(name).toLowerCase()}`,
      readFileSync(path.join(PHOTOS_DIR, name)),
    );
    uploaded += 1;
    rows.push({ project_id: project.id, url: object, type: "image", is_public: true, sort_order: i });
  }

  if (rows.length > 0) {
    const media = await api("project_media", { method: "POST", body: JSON.stringify(rows) });
    if (!media.ok) throw new Error(`media ${spec.slug}: ${media.status} ${await media.text()}`);
  }

  console.log(`  ${spec.slug}: cover + ${rows.length} photo(s)`);
}

console.log(`\n${uploaded} object(s) uploaded, ${chunks.length} project(s) published.\n`);
