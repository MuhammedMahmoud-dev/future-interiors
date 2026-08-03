import "server-only";
import { getSupabase } from "./supabase";

/**
 * Admin-side reads. Unlike lib/data.ts these are unrestricted — the admin is the
 * engineer and sees every field, including the private ones. The public column
 * allowlist deliberately does not apply here.
 *
 * All writes live in the admin Server Actions, which call requireAdmin() first.
 */

export type AdminProject = {
  id: string;
  code: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  unit_no: string | null;
  building_no: string | null;
  client_name: string | null;
  client_phone: string | null;
  supervision_rate: number | string;
  compound: string | null;
  district: string | null;
  area_m2: number | string | null;
  start_date: string | null;
  end_date: string | null;
  status: "in_progress" | "completed" | "on_hold";
  cover_image: string | null;
  is_public: boolean;
  publish_approved_at: string | null;
  created_at: string;
};

export async function getAdminOverview() {
  const supabase = getSupabase();
  const empty = {
    inProgress: 0,
    completed: 0,
    onHold: 0,
    published: 0,
    recent: [] as { id: string; code: string; title_ar: string; lastActivity: string | null }[],
  };
  if (!supabase) return empty;

  const { data } = await supabase
    .from("projects")
    .select("id,code,title_ar,status,is_public,publish_approved_at,created_at")
    .order("created_at", { ascending: false });

  const projects = data ?? [];
  return {
    inProgress: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    onHold: projects.filter((p) => p.status === "on_hold").length,
    published: projects.filter((p) => p.is_public && p.publish_approved_at).length,
    recent: projects.slice(0, 6).map((p) => ({
      id: p.id,
      code: p.code,
      title_ar: p.title_ar,
      lastActivity: p.created_at ? String(p.created_at).slice(0, 10) : null,
    })),
  };
}

export async function listProjects(): Promise<AdminProject[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as AdminProject[];
}

export async function getAdminProject(id: string): Promise<AdminProject | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  return (data as AdminProject) ?? null;
}

export type LedgerExpense = {
  id: string;
  date: string;
  item_ar: string;
  amount: number | string;
  stage_id: string | null;
  sort_order: number;
};

export type LedgerPayment = {
  id: string;
  date: string;
  label_ar: string;
  amount: number | string;
  seq: number;
};

export async function getExpenses(projectId: string): Promise<LedgerExpense[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("expenses")
    .select("id,date,item_ar,amount,stage_id,sort_order")
    .eq("project_id", projectId)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []) as LedgerExpense[];
}

export async function getPayments(projectId: string): Promise<LedgerPayment[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("payments")
    .select("id,date,label_ar,amount,seq")
    .eq("project_id", projectId)
    .order("date", { ascending: true })
    .order("seq", { ascending: true });
  return (data ?? []) as LedgerPayment[];
}

export type StageProgress = {
  stages: { id: string; name_ar: string }[];
  progress: Record<string, string>;
  notes: Record<string, string>;
};

export async function getStageProgress(projectId: string): Promise<StageProgress> {
  const supabase = getSupabase();
  if (!supabase) return { stages: [], progress: {}, notes: {} };

  const [{ data: stages }, { data: rows }] = await Promise.all([
    supabase.from("stages").select("id,name_ar,order_index").order("order_index"),
    supabase.from("project_stages").select("stage_id,status,note_ar").eq("project_id", projectId),
  ]);

  const progress: Record<string, string> = {};
  const notes: Record<string, string> = {};
  for (const row of rows ?? []) {
    progress[row.stage_id] = row.status;
    if (row.note_ar) notes[row.stage_id] = row.note_ar;
  }

  return { stages: (stages ?? []) as { id: string; name_ar: string }[], progress, notes };
}

export type AdminMedia = {
  id: string;
  url: string;
  caption_ar: string | null;
  stage_id: string | null;
  phase: "before" | "during" | "after" | null;
  is_public: boolean;
  sort_order: number;
};

export async function getAdminMedia(projectId: string): Promise<AdminMedia[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("project_media")
    .select("id,url,caption_ar,stage_id,phase,is_public,sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as AdminMedia[];
}

/** Generic list read for the content tables. */
export async function listRecords(
  table: string,
  orderBy = "order_index",
): Promise<Record<string, unknown>[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from(table).select("*").order(orderBy, { ascending: true });
  if (error) {
    console.error(`[adminData] listRecords ${table}`, error.message);
    return [];
  }
  return data ?? [];
}
