import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { LedgerGrid } from "@/components/admin/LedgerGrid";
import { MediaManager, type MediaItem } from "@/components/admin/MediaManager";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { StagesEditor } from "@/components/admin/StagesEditor";
import { requireAdmin } from "@/lib/admin";
import {
  getAdminMedia,
  getAdminProject,
  getExpenses,
  getPayments,
  getStageProgress,
  listClients,
} from "@/lib/adminData";
import { computeStatement, formatMoney } from "@/lib/finance";
import { signMedia } from "@/lib/media";
import { updateProject } from "../actions";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "details", label: "بيانات المشروع" },
  { key: "expenses", label: "البنود" },
  { key: "payments", label: "الدفعات" },
  { key: "stages", label: "المراحل" },
  { key: "media", label: "الصور" },
] as const;

export default async function AdminProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((entry) => entry.key === rawTab) ? rawTab! : "details";

  const project = await getAdminProject(id);
  if (!project) notFound();

  const [expenses, payments, stageData, clients] = await Promise.all([
    getExpenses(id),
    getPayments(id),
    getStageProgress(id),
    listClients(),
  ]);

  // The engineer needs the same totals the client sees, including the fee.
  const statement = computeStatement(expenses, payments, project.supervision_rate);

  return (
    <AdminShell
      title={project.title_ar}
      action={
        <div className="flex items-center gap-3 text-xs">
          <span className="text-ink/40">كود المتابعة</span>
          <code className="brand bg-ink px-3 py-2 text-white" dir="ltr">
            {project.code}
          </code>
        </div>
      }
    >
      <div className="mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Total label="إجمالي التكلفة" value={statement.total_cost} />
        <Total label="الإشراف الهندسي" value={statement.supervision_fee} />
        <Total label="الإجمالي" value={statement.grand_total} />
        <Total label="المدفوع" value={statement.total_payments} />
        <Total label="الفرق" value={statement.balance} highlight />
      </div>

      <nav className="mb-8 flex flex-wrap gap-1 border-b border-ink/10">
        {TABS.map((entry) => (
          <Link
            key={entry.key}
            href={`/admin/projects/${id}?tab=${entry.key}`}
            className={`-mb-px border-b-2 px-5 py-3 text-sm transition-colors ${
              tab === entry.key
                ? "border-gold text-ink"
                : "border-transparent text-ink/45 hover:text-ink"
            }`}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {tab === "details" && (
        <ProjectForm
          action={updateProject.bind(null, id)}
          project={project}
          submitLabel="حفظ التعديلات"
          clients={clients}
        />
      )}

      {tab === "expenses" && (
        <LedgerGrid
          projectId={id}
          kind="expenses"
          stages={stageData.stages}
          initialRows={expenses.map((row) => ({
            key: row.id,
            id: row.id,
            date: row.date ?? "",
            text: row.item_ar ?? "",
            amount: String(row.amount ?? ""),
            stageId: row.stage_id,
          }))}
        />
      )}

      {tab === "payments" && (
        <LedgerGrid
          projectId={id}
          kind="payments"
          stages={[]}
          initialRows={payments.map((row) => ({
            key: row.id,
            id: row.id,
            date: row.date ?? "",
            text: row.label_ar ?? "",
            amount: String(row.amount ?? ""),
          }))}
        />
      )}

      {tab === "stages" && (
        <StagesEditor
          projectId={id}
          stages={stageData.stages}
          initialProgress={stageData.progress}
          initialNotes={stageData.notes}
        />
      )}

      {tab === "media" && <MediaTab projectId={id} coverPath={project.cover_image} stages={stageData.stages} />}
    </AdminShell>
  );
}

async function MediaTab({
  projectId,
  coverPath,
  stages,
}: {
  projectId: string;
  coverPath: string | null;
  stages: { id: string; name_ar: string }[];
}) {
  const media = await getAdminMedia(projectId);
  const signed = await signMedia(media.map((item) => item.url));

  const items: MediaItem[] = media.map((item) => ({
    id: item.id,
    url: item.url,
    signedUrl: signed.get(item.url) ?? null,
    caption_ar: item.caption_ar,
    stage_id: item.stage_id,
    phase: item.phase,
    is_public: item.is_public,
  }));

  return <MediaManager projectId={projectId} items={items} stages={stages} coverPath={coverPath} />;
}

function Total({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const tone = highlight ? (value >= 0 ? "text-green-700" : "text-red-600") : "";
  return (
    <div className="border border-ink/10 bg-white p-4">
      <p className="text-xs text-ink/45">{label}</p>
      <p className={`brand mt-2 text-lg ${tone}`} dir="ltr">
        {formatMoney(value)}
      </p>
    </div>
  );
}
