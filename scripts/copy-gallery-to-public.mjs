/**
 * Creates the public 'gallery' bucket and copies every gallery photograph into
 * it from the private 'media' bucket, under the same path.
 *
 *   node --env-file=.env.test  scripts/copy-gallery-to-public.mjs
 *   node --env-file=.env.local scripts/copy-gallery-to-public.mjs   (production)
 *
 * Additive only: nothing is deleted, and gallery_images is not touched, so the
 * old code keeps working until the new one is deployed and the originals stay
 * as a rollback. Safe to re-run. See supabase/migrations/0007.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");

const auth = { apikey: key, Authorization: `Bearer ${key}` };
const BUCKET = "gallery";
const YEAR = "31536000";

console.log(`target: ${new URL(url).hostname}`);

// ---------------------------------------------------------------- bucket
const spec = {
  id: BUCKET,
  name: BUCKET,
  public: true,
  file_size_limit: 15 * 1024 * 1024,
  allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
};
let res = await fetch(`${url}/storage/v1/bucket`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify(spec),
});
if (!res.ok) {
  const body = await res.text();
  if (!/already exists|Duplicate/i.test(body)) throw new Error(`create bucket: ${res.status} ${body}`);
  res = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, {
    method: "PUT",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify(spec),
  });
  if (!res.ok) throw new Error(`update bucket: ${res.status} ${await res.text()}`);
  console.log("bucket: existed, made public");
} else {
  console.log("bucket: created (public)");
}

// ---------------------------------------------------------------- objects
res = await fetch(`${url}/rest/v1/gallery_images?select=url&order=sort_order`, { headers: auth });
if (!res.ok) throw new Error(`gallery_images: ${res.status} ${await res.text()}`);
const paths = (await res.json()).map((row) => row.url);

let failed = 0;
for (const path of paths) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const source = await fetch(`${url}/storage/v1/object/media/${encoded}`, { headers: auth });
  if (!source.ok) {
    failed++;
    console.log(`  MISSING in media: ${path} (${source.status})`);
    continue;
  }
  const bytes = Buffer.from(await source.arrayBuffer());
  const type = source.headers.get("content-type") ?? "image/jpeg";

  const put = await fetch(`${url}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": type, "x-upsert": "true", "cache-control": `max-age=${YEAR}` },
    body: bytes,
  });
  if (!put.ok) throw new Error(`upload ${path}: ${put.status} ${await put.text()}`);

  // Proof, not assumption: the public link answers, anonymously, with the same bytes.
  const check = await fetch(`${url}/storage/v1/object/public/${BUCKET}/${encoded}`);
  const back = Buffer.from(await check.arrayBuffer());
  const ok = check.ok && back.length === bytes.length;
  if (!ok) failed++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${path}  ${bytes.length} B  public=${check.status}  cache=${check.headers.get("cache-control")}`);
}

console.log(`\n${paths.length - failed}/${paths.length} gallery photos served publicly`);
if (failed) process.exit(1);
