import "server-only";
import { getSupabase } from "./supabase";

const BUCKET = "media";

/**
 * The works gallery lives in its own PUBLIC bucket, served by plain links that
 * never expire.
 *
 * It used to be signed out of the private bucket like everything else. Public
 * pages are cached and rebuilt only when someone visits, and the visitor who
 * triggers a rebuild is handed the old copy — so after a quiet day that copy's
 * 24-hour links had expired and the first visitor saw no photographs (measured
 * 2026-11-01: /ar served 57 hours old, all 7 gallery links 33 hours dead). A
 * link with no expiry cannot go stale with its page. It is also the same URL on
 * every rebuild, so the image optimizer's cache keeps working instead of
 * re-processing every photograph after each one.
 *
 * Only gallery photographs belong here: they are published by definition. Stage
 * photos stay private and signed (signMedia). A hidden gallery photo is still
 * reachable by anyone holding its random UUID path — unlisted, not secret.
 */
export const GALLERY_BUCKET = "gallery";

/** Stable public URL for a gallery object path; null when Supabase is unconfigured. */
export function galleryUrl(path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !path) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${GALLERY_BUCKET}/${encoded}`;
}

/**
 * The bucket is private, so images are served through signed URLs minted on the
 * server. Expiry (24h) is deliberately far longer than the pages' revalidate
 * window (1h), so a cached page never outlives its own image links.
 *
 * ponytail: signed URLs are not CDN-cacheable across renders. If image traffic
 * ever becomes a cost problem, move approved-public objects to a public bucket.
 */
const EXPIRES_IN = 60 * 60 * 24;

/** Batch-signs storage paths. Returns a path -> URL map; missing objects are simply absent. */
export async function signMedia(paths: readonly string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return map;

  const supabase = getSupabase();
  if (!supabase) return map;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(unique, EXPIRES_IN);
  /*
   * Throw, never return an empty map, when the request as a whole fails: an
   * empty map renders every photograph as missing, and on a cached page that
   * becomes the page. A single missing object still just drops that entry.
   */
  if (error) throw new Error(`[media] signMedia: ${error.message}`);
  if (!data) return map;

  for (const entry of data) {
    if (entry.signedUrl && entry.path) map.set(entry.path, entry.signedUrl);
  }
  return map;
}
