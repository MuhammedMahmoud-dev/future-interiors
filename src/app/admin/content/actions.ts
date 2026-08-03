"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { getContentSpec, isContentKey, type ContentKey, type FieldSpec } from "@/lib/contentSchema";

/**
 * Generic content writes.
 *
 * The table and every column are resolved from CONTENT_SPECS, never taken from
 * the request — otherwise this would be a write-anything endpoint. Unknown
 * columns in the payload are dropped silently rather than passed through.
 */

export type ContentValues = Record<string, string | boolean>;
export type ContentResult = { error: string | null; id?: string };

function coerce(field: FieldSpec, raw: string | boolean | undefined) {
  switch (field.type) {
    case "boolean":
      return Boolean(raw);
    case "number": {
      const value = Number(String(raw ?? "").trim());
      return Number.isFinite(value) ? value : 0;
    }
    case "list":
      return String(raw ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    default: {
      const value = String(raw ?? "").trim();
      return value === "" ? null : value;
    }
  }
}

function buildPayload(key: ContentKey, values: ContentValues) {
  const spec = getContentSpec(key);
  const payload: Record<string, unknown> = {};

  for (const field of spec.fields) {
    const value = coerce(field, values[field.name]);
    if (field.required && (value === null || value === "")) {
      throw new Error(`${field.label} مطلوب`);
    }
    payload[field.name] = value;
  }
  return payload;
}

export async function saveContentRecord(
  key: string,
  id: string | null,
  values: ContentValues,
): Promise<ContentResult> {
  await requireAdmin();
  if (!isContentKey(key)) return { error: "قسم غير معروف" };

  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase مش متظبط" };

  const spec = getContentSpec(key);

  try {
    const payload = buildPayload(key, values);

    if (id) {
      const { error } = await supabase.from(spec.table).update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      revalidateAll(key);
      return { error: null, id };
    }

    const { data, error } = await supabase.from(spec.table).insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    revalidateAll(key);
    return { error: null, id: data.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "الحفظ فشل" };
  }
}

export async function deleteContentRecord(key: string, id: string): Promise<ContentResult> {
  await requireAdmin();
  if (!isContentKey(key)) return { error: "قسم غير معروف" };

  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase مش متظبط" };

  const spec = getContentSpec(key);
  if (spec.singleton) return { error: "القسم ده مايتحذفش" };

  const { error } = await supabase.from(spec.table).delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateAll(key);
  return { error: null };
}

function revalidateAll(key: ContentKey) {
  revalidatePath("/[locale]", "layout");
  revalidatePath(`/admin/content/${key}`);
}
