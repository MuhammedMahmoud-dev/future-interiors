import "server-only";
import { headers } from "next/headers";
import { getSupabase } from "./supabase";

/**
 * 5 attempts per 15 minutes per (IP + key), shared by the client portal login
 * and the admin login.
 *
 * Backed by Postgres rather than an in-memory counter: serverless instances do
 * not share memory, so a Map would reset on every cold start and the limit
 * would never actually bind.
 */

const MAX_ATTEMPTS = 5;
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
  const { count, error } = await supabase
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("code", key)
    .gte("attempted_at", since);

  if (error) {
    console.error("[rateLimit] check failed", error.message);
    return false; // never lock someone out because of an infrastructure error
  }
  return (count ?? 0) >= MAX_ATTEMPTS;
}

export async function recordAttempt(ip: string, key: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("login_attempts").insert({ ip, code: key });
}

/** A successful login clears the counter so a typo is not punished. */
export async function clearAttempts(ip: string, key: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("login_attempts").delete().eq("ip", ip).eq("code", key);
}
