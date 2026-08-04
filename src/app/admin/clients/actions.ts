"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { normalizePhone } from "@/lib/i18n";

/**
 * Client records. Every action re-checks the admin session: a Server Action is
 * a public HTTP endpoint, and being rendered by a guarded page protects the
 * page, not the action.
 */

export type ClientFormState = { error: string | null; savedAt?: number };

function requireDb() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

/** Phones are stored normalised so the unique index treats every format as one client. */
function readForm(formData: FormData): { name: string; phone: string } {
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!name) throw new Error("اسم العميل مطلوب");
  if (!phone) throw new Error("رقم الموبايل مطلوب");
  if (!/^1\d{9}$/.test(phone)) throw new Error("رقم الموبايل مش صحيح (مثال: 01115134141)");

  return { name, phone };
}

function friendly(message: string): string {
  if (message.includes("clients_phone_key")) return "الرقم ده مسجّل لعميل تاني بالفعل";
  return message;
}

export async function createClient(
  _previous: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireAdmin();
  const supabase = requireDb();

  try {
    const { name, phone } = readForm(formData);
    const { error } = await supabase.from("clients").insert({ name, phone });
    if (error) throw new Error(friendly(error.message));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "الحفظ فشل" };
  }

  revalidatePath("/admin/clients");
  return { error: null, savedAt: Date.now() };
}

export async function updateClient(
  id: string,
  _previous: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireAdmin();
  const supabase = requireDb();

  try {
    const { name, phone } = readForm(formData);
    const { error } = await supabase.from("clients").update({ name, phone }).eq("id", id);
    if (error) throw new Error(friendly(error.message));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "الحفظ فشل" };
  }

  revalidatePath("/admin/clients");
  return { error: null, savedAt: Date.now() };
}

/**
 * Archive, never delete.
 *
 * This sets a timestamp and touches nothing else: the client row, their
 * projects, and every ledger line stay exactly as they were. It also does NOT
 * affect portal access — the login looks a client up by project code and phone
 * without consulting archived_at, so an archived client can still open their
 * own statement. That is intended, and scripts/verify-clients.mjs proves it.
 */
export async function archiveClient(id: string) {
  await requireAdmin();
  const supabase = requireDb();

  const { error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/clients");
}

export async function restoreClient(id: string) {
  await requireAdmin();
  const supabase = requireDb();

  const { error } = await supabase.from("clients").update({ archived_at: null }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/clients");
}
