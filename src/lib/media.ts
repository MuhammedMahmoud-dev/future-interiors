import "server-only";
import { getSupabase } from "./supabase";

const BUCKET = "media";

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
