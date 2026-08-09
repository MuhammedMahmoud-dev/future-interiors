"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

/**
 * The works gallery, managed on its own.
 *
 * Every action re-checks the admin session: a Server Action is a public HTTP
 * endpoint, and being rendered by a guarded page protects nothing.
 *
 * These deliberately never touch `projects` or `project_media`. The gallery was
 * split out precisely so a project's lifecycle cannot reach these photographs;
 * reaching back the other way would rebuild the coupling from the far side.
 */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 15 * 1024 * 1024;

function requireDb() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

function refresh() {
  revalidatePath("/admin/gallery");
  // /works and the homepage both read this table.
  revalidatePath("/[locale]", "layout");
}

export async function uploadGalleryImages(formData: FormData) {
  await requireAdmin();
  const supabase = requireDb();

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) return;

  // New photographs go to the end, so an upload never reshuffles what is there.
  const { data: last } = await supabase
    .from("gallery_images")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let next = (last?.sort_order ?? -1) + 1;

  for (const file of files) {
    if (file.size === 0) continue;
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error(`نوع الملف مش مدعوم: ${file.name}`);
    if (file.size > MAX_BYTES) throw new Error(`الملف كبير أوي (الحد 15 ميجا): ${file.name}`);

    // Unguessable path; the bucket is private but paths should not be enumerable.
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `gallery/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { error } = await supabase
      .from("gallery_images")
      .insert({ url: path, sort_order: next });
    if (error) {
      // Do not leave an object nothing points at.
      await supabase.storage.from("media").remove([path]);
      throw new Error(error.message);
    }

    next += 1;
  }

  refresh();
}

export async function updateGalleryImage(
  id: string,
  patch: { caption_ar?: string | null; is_public?: boolean },
) {
  await requireAdmin();
  const supabase = requireDb();

  const clean: Record<string, unknown> = {};
  if ("caption_ar" in patch) clean.caption_ar = patch.caption_ar?.trim() || null;
  if ("is_public" in patch) clean.is_public = Boolean(patch.is_public);

  const { error } = await supabase.from("gallery_images").update(clean).eq("id", id);
  if (error) throw new Error(error.message);

  refresh();
}

export async function deleteGalleryImage(id: string, path: string) {
  await requireAdmin();
  const supabase = requireDb();

  await supabase.storage.from("media").remove([path]);
  const { error } = await supabase.from("gallery_images").delete().eq("id", id);
  if (error) throw new Error(error.message);

  refresh();
}

/**
 * Moves one photograph one place up or down, by swapping sort_order with its
 * neighbour.
 *
 * A swap rather than renumbering the whole list: two writes instead of N, and
 * nothing else moves. sort_order is deliberately not unique in the schema, so
 * the moment between the two updates — when both rows briefly hold the same
 * number — is legal rather than a constraint violation.
 */
export async function moveGalleryImage(id: string, direction: "up" | "down") {
  await requireAdmin();
  const supabase = requireDb();

  const { data: rows } = await supabase
    .from("gallery_images")
    .select("id,sort_order")
    .order("sort_order", { ascending: true });

  const list = rows ?? [];
  const index = list.findIndex((row) => row.id === id);
  if (index === -1) return;

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return; // already at the end

  const a = list[index];
  const b = list[target];

  await supabase.from("gallery_images").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("gallery_images").update({ sort_order: a.sort_order }).eq("id", b.id);

  refresh();
}
