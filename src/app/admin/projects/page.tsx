import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { listProjects } from "@/lib/adminData";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  in_progress: "جاري التنفيذ",
  completed: "مكتمل",
  on_hold: "متوقف",
};

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  await requireAdmin();
  const { archived: showArchived } = await searchParams;
  const showing = showArchived === "1";

  // Filtered here rather than in the query: the engineer runs a handful of
  // projects at a time, and one fetch keeps the counter below honest.
  const all = await listProjects();
  const projects = showing ? all : all.filter((project) => !project.archived_at);
  const archivedCount = all.filter((project) => project.archived_at).length;

  return (
    <AdminShell
      title="المشاريع"
      action={
        <Link
          href="/admin/projects/new"
          className="rounded-pill bg-ink px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          مشروع جديد
        </Link>
      }
    >
      {archivedCount > 0 && (
        <p className="mb-4 text-xs text-muted-ink">
          <Link
            href={showing ? "/admin/projects" : "/admin/projects?archived=1"}
            className="underline underline-offset-4 hover:text-ink"
          >
            {showing ? "إخفاء المؤرشف" : `عرض المؤرشف (${archivedCount})`}
          </Link>
        </p>
      )}

      {projects.length === 0 ? (
        <p className="border border-dashed border-border px-6 py-16 text-center text-sm text-muted-ink">
          لسه مفيش مشاريع.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-surface text-xs text-muted-ink">
                <th className="px-4 py-3 text-start font-normal">المشروع</th>
                <th className="px-4 py-3 text-start font-normal">الكود</th>
                <th className="px-4 py-3 text-start font-normal">العميل</th>
                <th className="px-4 py-3 text-start font-normal">الحالة</th>
                <th className="px-4 py-3 text-start font-normal">على الموقع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className={`transition-colors hover:bg-surface ${
                    project.archived_at ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${project.id}`} className="hover:text-ink">
                      {project.title_ar}
                    </Link>
                    {project.archived_at && (
                      <span className="ms-2 border border-border px-1.5 py-0.5 text-[10px] text-muted-ink">
                        مؤرشف
                      </span>
                    )}
                    {/* The compound was here, and now reads "—" for most rows
                        since it moved into the collapsed details. The code is
                        always present and is what gets quoted to a client. */}
                    <span className="brand block text-xs text-muted-ink" dir="ltr">
                      {project.code}
                    </span>
                  </td>
                  <td className="brand px-4 py-3 text-xs" dir="ltr">
                    {project.code}
                  </td>
                  {/* Read through the client_id relation, not duplicated here. */}
                  <td className="px-4 py-3 text-muted-ink">
                    {project.clients ? (
                      <>
                        {project.clients.name}
                        <span className="block text-xs text-muted-ink" dir="ltr">
                          {/^1\d{9}$/.test(project.clients.phone)
                            ? `0${project.clients.phone}`
                            : project.clients.phone}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-ink">
                    {STATUS_LABEL[project.status] ?? project.status}
                  </td>
                  <td className="px-4 py-3">
                    {project.is_public && project.publish_approved_at ? (
                      <span className="text-green-700">معروض</span>
                    ) : (
                      <span className="text-muted-ink">مخفي</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
