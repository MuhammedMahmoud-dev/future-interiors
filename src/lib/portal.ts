import "server-only";
import { cookies } from "next/headers";
import { getSupabase } from "./supabase";
import { computeStatement, type Statement } from "./finance";
import { normalizePhone } from "./i18n";
import { PORTAL_COOKIE, getSessionSecret, readSessionToken } from "./session";

/**
 * Client portal internals: credential checks and statement assembly.
 * Everything here runs server-side with the service_role key.
 *
 * The supervision rate is read here to compute the fee and is never returned.
 */

// Rate limiting is shared with the admin login; see ./rateLimit.
export { getClientIp, isRateLimited, recordAttempt, clearAttempts } from "./rateLimit";

// ------------------------------------------------------------------ credentials

/**
 * Returns the project id when both the code and the phone match, otherwise null.
 * The caller shows one generic message either way — never which field was wrong.
 */
export async function verifyCredentials(code: string, phone: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("id,client_phone")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (error || !data) return null;

  const given = normalizePhone(phone);
  const stored = normalizePhone(data.client_phone ?? "");
  if (!given || !stored || given !== stored) return null;

  return data.id as string;
}

// ------------------------------------------------------------------ session

export async function getSessionProjectId(): Promise<string | null> {
  const store = await cookies();
  return readSessionToken(store.get(PORTAL_COOKIE)?.value, getSessionSecret(), "portal");
}

// ------------------------------------------------------------------ statement

export type PortalExpense = {
  id: string;
  date: string;
  item_ar: string;
  item_en: string | null;
  amount: number;
  stage_id: string | null;
};

export type PortalPayment = {
  id: string;
  date: string;
  label_ar: string;
  label_en: string | null;
  amount: number;
};

export type PortalMedia = {
  id: string;
  url: string;
  caption_ar: string | null;
  caption_en: string | null;
  stage_id: string | null;
  phase: string | null;
};

export type PortalStage = {
  id: string;
  name_ar: string;
  name_en: string | null;
  status: "not_started" | "in_progress" | "done";
  note_ar: string | null;
  note_en: string | null;
};

export type PortalData = {
  project: {
    id: string;
    code: string;
    title_ar: string;
    title_en: string | null;
    status: string;
    compound: string | null;
    district: string | null;
  };
  statement: Statement;
  expenses: PortalExpense[];
  payments: PortalPayment[];
  stages: PortalStage[];
  media: PortalMedia[];
  /** Share of stages marked done, 0-100. Derived, never stored. */
  progress: number;
};

export async function getPortalData(projectId: string): Promise<PortalData | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // supervision_rate is selected here and deliberately never leaves this function.
  const { data: project, error } = await supabase
    .from("projects")
    .select("id,code,title_ar,title_en,status,compound,district,supervision_rate")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) return null;

  const [expensesRes, paymentsRes, stagesRes, projectStagesRes, mediaRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("id,date,item_ar,item_en,amount,stage_id")
      .eq("project_id", projectId)
      .order("date", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("payments")
      .select("id,date,label_ar,label_en,amount")
      .eq("project_id", projectId)
      .order("date", { ascending: true })
      .order("seq", { ascending: true }),
    supabase.from("stages").select("id,name_ar,name_en,order_index").order("order_index"),
    supabase
      .from("project_stages")
      .select("stage_id,status,note_ar,note_en")
      .eq("project_id", projectId),
    supabase
      .from("project_media")
      .select("id,url,caption_ar,caption_en,stage_id,phase,sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
  ]);

  const rawExpenses = expensesRes.data ?? [];
  const rawPayments = paymentsRes.data ?? [];

  // Amounts arrive as strings from numeric columns; finance.ts coerces them.
  const statement = computeStatement(rawExpenses, rawPayments, project.supervision_rate);

  const progressRows = projectStagesRes.data ?? [];
  const stages: PortalStage[] = (stagesRes.data ?? []).map((stage) => {
    const row = progressRows.find((r) => r.stage_id === stage.id);
    return {
      id: stage.id,
      name_ar: stage.name_ar,
      name_en: stage.name_en,
      status: row?.status ?? "not_started",
      note_ar: row?.note_ar ?? null,
      note_en: row?.note_en ?? null,
    };
  });

  const done = stages.filter((stage) => stage.status === "done").length;

  return {
    project: {
      id: project.id,
      code: project.code,
      title_ar: project.title_ar,
      title_en: project.title_en,
      status: project.status,
      compound: project.compound,
      district: project.district,
    },
    statement,
    expenses: rawExpenses.map((row) => ({ ...row, amount: Number(row.amount) })),
    payments: rawPayments.map((row) => ({ ...row, amount: Number(row.amount) })),
    stages,
    media: mediaRes.data ?? [],
    progress: stages.length > 0 ? Math.round((done / stages.length) * 100) : 0,
  };
}
