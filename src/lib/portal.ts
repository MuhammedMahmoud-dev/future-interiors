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
 * Two different failures, so a single `null` will not do: wrong credentials get
 * one generic message, while a project whose portal the engineer has closed gets
 * a distinct one. `invalid` never says which field was wrong.
 */
export type CredentialCheck =
  | { ok: true; projectId: string }
  | { ok: false; reason: "invalid" | "disabled" };

/**
 * Resolves a code and phone to a project id.
 *
 * The phone is read through the clients relation rather than off the project.
 *
 * There is deliberately NO filter on clients.archived_at here, and there must
 * never be one. Archiving is a housekeeping flag for the admin's own list; it
 * does not revoke a client's access to the statement for work they paid for.
 * scripts/verify-clients.mjs signs in before and after archiving to prove it.
 *
 * `portal_access_enabled` is a separate, explicit decision by the engineer and
 * is checked independently of that. THE ORDER MATTERS: it is tested only after
 * the phone has already matched. Checking it earlier would turn the distinct
 * "disabled" message into an oracle — anyone holding a bare code could learn
 * whether it was real. As written, `disabled` is reachable only by someone who
 * already has both correct credentials, which is the client themselves.
 */
export async function verifyCredentials(code: string, phone: string): Promise<CredentialCheck> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: "invalid" };

  const { data, error } = await supabase
    .from("projects")
    .select("id,portal_access_enabled,clients(phone)")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (error || !data) return { ok: false, reason: "invalid" };

  // PostgREST returns an embedded to-one relation as an object, but older
  // versions and some shapes hand back a single-element array.
  const client = Array.isArray(data.clients) ? data.clients[0] : data.clients;

  const given = normalizePhone(phone);
  const stored = normalizePhone(client?.phone ?? "");
  if (!given || !stored || given !== stored) return { ok: false, reason: "invalid" };

  // Only now, with both credentials confirmed, is the access flag consulted.
  if (data.portal_access_enabled === false) return { ok: false, reason: "disabled" };

  return { ok: true, projectId: data.id as string };
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
    .select("id,code,title_ar,title_en,status,compound,district,supervision_rate,portal_access_enabled")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) return null;

  /*
   * Access is re-checked on every portal page, not only at login.
   *
   * A session cookie lasts eight hours. If the flag were read only when signing
   * in, closing a project's portal would leave whoever was already inside able
   * to keep reading it for the rest of that window. Returning null here makes
   * the pages redirect to /track on the client's very next request, and it costs
   * nothing — the row was being fetched anyway.
   */
  if (project.portal_access_enabled === false) return null;

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
