import "server-only";
import { getSupabase } from "./supabase";
import {
  PUBLIC_PROJECT_COLUMNS,
  PUBLIC_MEDIA_COLUMNS,
  PUBLIC_GALLERY_COLUMNS,
} from "./publicFields";

/**
 * Every public read goes through this module.
 *
 * Two rules hold the privacy guarantee, and they live here so there is one
 * place to audit:
 *   1. Project reads use PUBLIC_PROJECT_COLUMNS, never `select('*')`.
 *   2. A project is only visible when is_public AND publish_approved_at are set.
 *
 * All functions degrade to empty results when Supabase is unconfigured, so the
 * site builds and renders its empty states before the keys exist.
 */

/**
 * A failed query is an outage, never an empty result — so it throws.
 *
 * Every public page reading from here is cached and rebuilt in the background.
 * If a rebuild throws, Next keeps serving the last good copy and retries on the
 * next visit; if it *returns*, whatever it returned becomes the page. These
 * readers used to log the error and return [], so when the Supabase project was
 * paused the next rebuild of /works produced a gallery with no photographs and
 * cached it for an hour — while the data sat intact the whole time.
 *
 * "Unconfigured" is different and still returns empty (the early returns
 * below): with no keys at all there is no good copy to protect.
 */
function unwrap<T>(
  result: { data: unknown; error: { message: string } | null },
  reader: string,
): T | null {
  if (result.error) throw new Error(`[data] ${reader}: ${result.error.message}`);
  return result.data as T | null;
}

/** Mirrors PUBLIC_PROJECT_COLUMNS — no location, so none can reach a page. */
export type ProjectRow = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  area_m2: number | string | null;
  start_date: string | null;
  end_date: string | null;
  status: "in_progress" | "completed" | "on_hold";
  cover_image: string | null;
};

export type MediaRow = {
  id: string;
  url: string;
  type: "image" | "video";
  caption_ar: string | null;
  caption_en: string | null;
  phase: "before" | "during" | "after" | null;
  stage_id: string | null;
  sort_order: number;
};

export type ServiceRow = {
  id: string;
  title_ar: string;
  title_en: string | null;
  desc_ar: string | null;
  desc_en: string | null;
  bullets_ar: string[];
  bullets_en: string[];
  icon: string | null;
};

export type FaqRow = {
  id: string;
  question_ar: string;
  question_en: string | null;
  answer_ar: string;
  answer_en: string | null;
};

export type StatRow = {
  id: string;
  key: string;
  label_ar: string;
  label_en: string | null;
  value: number | string;
  suffix_ar: string | null;
  suffix_en: string | null;
};

export type TestimonialRow = {
  id: string;
  client_name: string | null;
  show_name: boolean;
  quote_ar: string;
  quote_en: string | null;
  compound: string | null;
};

export type EngineerRow = {
  name_ar: string;
  name_en: string | null;
  title_ar: string | null;
  title_en: string | null;
  bio_ar: string | null;
  bio_en: string | null;
  phone: string | null;
  whatsapp: string | null;
  syndicate_no: string | null;
  credentials_ar: string[];
  credentials_en: string[];
};

// ------------------------------------------------------------------ projects

export async function getPublishedProjects(options?: {
  limit?: number;
  completedOnly?: boolean;
}): Promise<ProjectRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase
    .from("projects")
    .select(PUBLIC_PROJECT_COLUMNS)
    .eq("is_public", true)
    .not("publish_approved_at", "is", null)
    .order("publish_approved_at", { ascending: false });

  if (options?.completedOnly) query = query.eq("status", "completed");
  if (options?.limit) query = query.limit(options.limit);

  return unwrap<ProjectRow[]>(await query, "getPublishedProjects") ?? [];
}

/*
 * getProjectBySlug was here. It was the lookup behind /works/[slug], which was
 * removed when the portfolio became a photo gallery, and it has had no callers
 * since. Left in place it was an invitation to resolve projects by a value the
 * engineer no longer controls — the slug is now derived from the project code
 * and is not addressable by anything.
 */

// ------------------------------------------------------------------ gallery

export type GalleryRow = {
  id: string;
  url: string;
  caption_ar: string | null;
  caption_en: string | null;
  sort_order: number;
};

/**
 * The works gallery — the photographs on /works and on the homepage.
 *
 * These used to be read out of project_media, joined through whichever projects
 * happened to be published. That coupling is what let a project deletion empty
 * the gallery, so this reads its own table and touches `projects` nowhere.
 */
export async function getGalleryImages(options?: { limit?: number }): Promise<GalleryRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase
    .from("gallery_images")
    .select(PUBLIC_GALLERY_COLUMNS)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  if (options?.limit) query = query.limit(options.limit);

  return unwrap<GalleryRow[]>(await query, "getGalleryImages") ?? [];
}

/** Only media the engineer has approved for publication. */
export async function getPublicProjectMedia(projectId: string): Promise<MediaRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const result = await supabase
    .from("project_media")
    .select(PUBLIC_MEDIA_COLUMNS)
    .eq("project_id", projectId)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  return unwrap<MediaRow[]>(result, "getPublicProjectMedia") ?? [];
}

// ------------------------------------------------------------------ content

export async function getServices(): Promise<ServiceRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const result = await supabase
    .from("services")
    .select("id,title_ar,title_en,desc_ar,desc_en,bullets_ar,bullets_en,icon")
    .eq("is_active", true)
    .order("order_index", { ascending: true });
  return unwrap<ServiceRow[]>(result, "getServices") ?? [];
}

export async function getFaqs(): Promise<FaqRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const result = await supabase
    .from("faqs")
    .select("id,question_ar,question_en,answer_ar,answer_en")
    .eq("is_active", true)
    .order("order_index", { ascending: true });
  return unwrap<FaqRow[]>(result, "getFaqs") ?? [];
}

export async function getStats(): Promise<StatRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const result = await supabase
    .from("site_stats")
    .select("id,key,label_ar,label_en,value,suffix_ar,suffix_en")
    .order("order_index", { ascending: true });
  return unwrap<StatRow[]>(result, "getStats") ?? [];
}

export async function getTestimonials(): Promise<TestimonialRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const result = await supabase
    .from("testimonials")
    .select("id,client_name,show_name,quote_ar,quote_en,compound")
    .eq("is_active", true)
    .order("order_index", { ascending: true });
  return unwrap<TestimonialRow[]>(result, "getTestimonials") ?? [];
}

export async function getEngineer(): Promise<EngineerRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const result = await supabase
    .from("engineer_profile")
    .select(
      "name_ar,name_en,title_ar,title_en,bio_ar,bio_en,phone,whatsapp,syndicate_no,credentials_ar,credentials_en",
    )
    .limit(1)
    .maybeSingle();
  return unwrap<EngineerRow>(result, "getEngineer");
}

/** WhatsApp number: env override first, then the profile row. */
export async function getWhatsappNumber(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP?.trim();
  if (fromEnv) return fromEnv;
  const engineer = await getEngineer();
  return engineer?.whatsapp ?? engineer?.phone ?? null;
}
