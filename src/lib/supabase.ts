import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service_role key.
 *
 * Every table has RLS enabled with zero policies, so anon and authenticated are
 * denied outright; service_role bypasses RLS. That makes this module the single
 * door to the data, and it can only be opened from the server.
 *
 * Returns null when env vars are absent so the site still builds and renders
 * empty states before the keys are configured.
 */

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  cached =
    url && serviceKey
      ? createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

  if (!cached && process.env.NODE_ENV !== "production") {
    console.warn("[supabase] env vars missing — rendering empty states");
  }
  return cached;
}
