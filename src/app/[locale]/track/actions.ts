"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  clearAttempts,
  getClientIp,
  isRateLimited,
  recordAttempt,
  verifyCredentials,
} from "@/lib/portal";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  getSessionSecret,
} from "@/lib/session";
import { defaultLocale, isLocale } from "@/lib/i18n";

export type LoginState = { error: "invalid" | "rateLimited" | "unavailable" | null };

/**
 * Server Actions are reachable by direct POST, not only through the form, so
 * this trusts nothing beyond the two typed fields and re-checks everything.
 */
export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const rawLocale = String(formData.get("locale") ?? defaultLocale);
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  if (!code || !phone) return { error: "invalid" };

  const ip = await getClientIp();

  if (await isRateLimited(ip, code)) return { error: "rateLimited" };

  // Recorded before verifying, so a mid-verify crash still counts the attempt.
  await recordAttempt(ip, code);

  let projectId: string | null;
  try {
    projectId = await verifyCredentials(code, phone);
  } catch (error) {
    console.error("[track] verification failed", error);
    return { error: "unavailable" };
  }

  // One generic outcome, regardless of which field was wrong.
  if (!projectId) return { error: "invalid" };

  await clearAttempts(ip, code);

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(projectId, getSessionSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  // Land on the dashboard so the code never appears in a URL after login.
  redirect(`/${locale}/track/dashboard`);
}

export async function logout(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? defaultLocale);
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect(`/${locale}/track`);
}
