import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { getAdminOverview } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const overview = await getAdminOverview();

  return (
    <AdminShell title="نظرة عامة">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="مشاريع جاري تنفيذها" value={overview.inProgress} />
        <Stat label="مشاريع مكتملة" value={overview.completed} />
        <Stat label="متوقفة مؤقتاً" value={overview.onHold} />
        <Stat label="معروضة على الموقع" value={overview.published} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-sm tracking-widest text-muted-ink">آخر تحديث</h2>
        {overview.recent.length === 0 ? (
          <p className="border border-dashed border-border px-6 py-12 text-center text-sm text-muted-ink">
            لسه مفيش مشاريع. ابدأ بإضافة مشروع.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border bg-white">
            {overview.recent.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-4 transition-colors hover:bg-surface"
                >
                  <span>{project.title_ar}</span>
                  <span className="brand text-xs text-muted-ink" dir="ltr">
                    {project.code} · {project.lastActivity ?? "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10">
        <Link
          href="/admin/projects/new"
          className="rounded-card bg-ink px-6 py-3 text-sm text-white transition-opacity hover:opacity-90"
        >
          مشروع جديد
        </Link>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-white p-6">
      <p className="text-xs text-muted-ink">{label}</p>
      <p className="brand mt-3 text-3xl" dir="ltr">
        {value}
      </p>
    </div>
  );
}
