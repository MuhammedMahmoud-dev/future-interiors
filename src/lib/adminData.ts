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
  client_id: string | null;
  /** Embedded through the client_id foreign key, not stored on the project. */
  clients: { id: string; name: string; phone: string; archived_at: string | null } | null;
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
  /** Client can open the tracking portal. Independent of clients.archived_at. */
  portal_access_enabled: boolean;
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

const PROJECT_WITH_CLIENT = "*,clients(id,name,phone,archived_at)";

export async function listProjects(): Promise<AdminProject[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_CLIENT)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as AdminProject[];
}

export async function getAdminProject(id: string): Promise<AdminProject | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_CLIENT)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as AdminProject) ?? null;
}

// ------------------------------------------------------------------ clients

export type AdminClient = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  archived_at: string | null;
  /** Derived from the relation, so it can never drift from reality. */
  projectCount: number;
};

/**
 * Clients with their project counts.
 *
 * Archived clients are excluded by default — that is the entire point of the
 * flag. Nothing here is ever deleted, so `includeArchived` brings them all back.
 */
export async function listClients(options?: { includeArchived?: boolean }): Promise<AdminClient[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase
    .from("clients")
    .select("id,name,phone,created_at,archived_at,projects(count)")
    .order("created_at", { ascending: false });

  if (!options?.includeArchived) query = query.is("archived_at", null);

  const { data, error } = await query;
  if (error) {
    console.error("[adminData] listClients", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    // PostgREST returns an aggregate embed as [{ count: n }].
    const embed = row.projects as unknown;
    const projectCount = Array.isArray(embed)
      ? Number((embed[0] as { count?: number } | undefined)?.count ?? embed.length)
      : 0;
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      created_at: row.created_at,
      archived_at: row.archived_at,
      projectCount: Number.isFinite(projectCount) ? projectCount : 0,
    };
  });
}

export async function getClient(id: string): Promise<AdminClient | null> {
  const clients = await listClients({ includeArchived: true });
  return clients.find((client) => client.id === id) ?? null;
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
