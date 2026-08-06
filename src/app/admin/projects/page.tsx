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

export default async function AdminProjectsPage() {
  await requireAdmin();
  const projects = await listProjects();

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
                <tr key={project.id} className="transition-colors hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${project.id}`} className="hover:text-ink">
                      {project.title_ar}
                    </Link>
                    <span className="block text-xs text-muted-ink">{project.compound ?? "—"}</span>
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
