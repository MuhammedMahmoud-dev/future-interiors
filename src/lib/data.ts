import "server-only";
import { getSupabase } from "./supabase";
import { PUBLIC_PROJECT_COLUMNS, PUBLIC_MEDIA_COLUMNS } from "./publicFields";

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

export type StageRow = { id: string; name_ar: string; name_en: string | null; order_index: number };

export type ProjectStageRow = {
  stage_id: string;
  status: "not_started" | "in_progress" | "done";
  started_at: string | null;
  completed_at: string | null;
  note_ar: string | null;
  note_en: string | null;
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

  const { data, error } = await query;
  if (error) {
    console.error("[data] getPublishedProjects", error.message);
    return [];
  }
  return (data ?? []) as unknown as ProjectRow[];
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("projects")
    .select(PUBLIC_PROJECT_COLUMNS)
    .eq("slug", slug)
    .eq("is_public", true)
    .not("publish_approved_at", "is", null)
    .maybeSingle();

  if (error) {
    console.error("[data] getProjectBySlug", error.message);
    return null;
  }
  return (data as unknown as ProjectRow) ?? null;
}

/** Only media the engineer has approved for publication. */
export async function getPublicProjectMedia(projectId: string): Promise<MediaRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("project_media")
    .select(PUBLIC_MEDIA_COLUMNS)
    .eq("project_id", projectId)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[data] getPublicProjectMedia", error.message);
    return [];
  }
  return (data ?? []) as unknown as MediaRow[];
}

export async function getProjectStages(projectId: string): Promise<ProjectStageRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("project_stages")
    .select("stage_id,status,started_at,completed_at,note_ar,note_en")
    .eq("project_id", projectId);

  if (error) {
    console.error("[data] getProjectStages", error.message);
    return [];
  }
  return (data ?? []) as ProjectStageRow[];
}

// ------------------------------------------------------------------ content

export async function getStages(): Promise<StageRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("stages")
    .select("id,name_ar,name_en,order_index")
    .order("order_index", { ascending: true });
  return (data ?? []) as StageRow[];
}

export async function getServices(): Promise<ServiceRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("services")
    .select("id,title_ar,title_en,desc_ar,desc_en,bullets_ar,bullets_en,icon")
    .eq("is_active", true)
    .order("order_index", { ascending: true });
  return (data ?? []) as ServiceRow[];
}

export async function getFaqs(): Promise<FaqRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("faqs")
    .select("id,question_ar,question_en,answer_ar,answer_en")
    .eq("is_active", true)
    .order("order_index", { ascending: true });
  return (data ?? []) as FaqRow[];
}

export async function getStats(): Promise<StatRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("site_stats")
    .select("id,key,label_ar,label_en,value,suffix_ar,suffix_en")
    .order("order_index", { ascending: true });
  return (data ?? []) as StatRow[];
}

export async function getTestimonials(): Promise<TestimonialRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("testimonials")
    .select("id,client_name,show_name,quote_ar,quote_en,compound")
    .eq("is_active", true)
    .order("order_index", { ascending: true });
  return (data ?? []) as TestimonialRow[];
}

export async function getEngineer(): Promise<EngineerRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("engineer_profile")
    .select(
      "name_ar,name_en,title_ar,title_en,bio_ar,bio_en,phone,whatsapp,syndicate_no,credentials_ar,credentials_en",
    )
    .limit(1)
    .maybeSingle();
  return (data as EngineerRow) ?? null;
}

/** WhatsApp number: env override first, then the profile row. */
export async function getWhatsappNumber(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP?.trim();
  if (fromEnv) return fromEnv;
  const engineer = await getEngineer();
  return engineer?.whatsapp ?? engineer?.phone ?? null;
}
