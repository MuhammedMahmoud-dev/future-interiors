import "server-only";
import { headers } from "next/headers";
import { getSupabase } from "./supabase";

/**
 * Two limits, both checked on every login, shared by the client portal login
 * and the admin login:
 *
 *   - 5 attempts per 15 minutes per (IP + key), so a client who mistypes their
 *     own code a few times is told to wait.
 *   - 20 attempts per 15 minutes per IP across ALL keys. The per-key limit
 *     alone does not bind a guesser: the key is the code being guessed, so a
 *     fresh guess is a fresh counter. This cap is what actually stops it.
 *
 * Backed by Postgres rather than an in-memory counter: serverless instances do
 * not share memory, so a Map would reset on every cold start and the limit
 * would never actually bind.
 */

const MAX_ATTEMPTS = 5;
const MAX_ATTEMPTS_PER_IP = 20;
const WINDOW_MINUTES = 15;

/** Client IP for rate limiting. Vercel sets x-forwarded-for. */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

export async function isRateLimited(ip: string, key: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const [perKey, perIp] = await Promise.all([
    supabase
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("code", key)
      .gte("attempted_at", since),
    supabase
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("attempted_at", since),
  ]);

  if (perKey.error || perIp.error) {
    console.error("[rateLimit] check failed", (perKey.error ?? perIp.error)?.message);
    return false; // never lock someone out because of an infrastructure error
  }
  return (perKey.count ?? 0) >= MAX_ATTEMPTS || (perIp.count ?? 0) >= MAX_ATTEMPTS_PER_IP;
}

export async function recordAttempt(ip: string, key: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("login_attempts").insert({ ip, code: key });

  // Housekeeping: rows older than a day can never count again. Pruned on
  // roughly 1 in 20 attempts so the table cannot grow without bound.
  if (Math.random() < 0.05) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    await supabase.from("login_attempts").delete().lt("attempted_at", cutoff);
  }
}

/** A successful login clears the counter so a typo is not punished. */
export async function clearAttempts(ip: string, key: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("login_attempts").delete().eq("ip", ip).eq("code", key);
}
