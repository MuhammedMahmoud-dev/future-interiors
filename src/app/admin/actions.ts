"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyAdminCredentials } from "@/lib/admin";
import { clearAttempts, getClientIp, isRateLimited, recordAttempt } from "@/lib/rateLimit";
import { ADMIN_COOKIE, ADMIN_TTL_SECONDS, createSessionToken, getSessionSecret } from "@/lib/session";

export type AdminLoginState = { error: "invalid" | "rateLimited" | null };

const RATE_KEY = "__admin__";

export async function adminLogin(
  _previous: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "invalid" };

  const ip = await getClientIp();
  if (await isRateLimited(ip, RATE_KEY)) return { error: "rateLimited" };
  await recordAttempt(ip, RATE_KEY);

  if (!verifyAdminCredentials(email, password)) return { error: "invalid" };

  await clearAttempts(ip, RATE_KEY);

  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionToken(email, getSessionSecret(), "admin", ADMIN_TTL_SECONDS), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_TTL_SECONDS,
  });

  redirect("/admin");
}

export async function adminLogout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
