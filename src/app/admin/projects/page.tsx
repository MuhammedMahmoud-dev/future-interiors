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
          className="rounded-sharp bg-ink px-6 py-3 text-sm text-white transition-opacity hover:opacity-90"
        >
          مشروع جديد
        </Link>
      }
    >
      {projects.length === 0 ? (
        <p className="border border-dashed border-ink/15 px-6 py-16 text-center text-sm text-ink/40">
          لسه مفيش مشاريع.
        </p>
      ) : (
        <div className="overflow-x-auto border border-ink/10 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-paper text-xs text-ink/50">
                <th className="px-4 py-3 text-start font-normal">المشروع</th>
                <th className="px-4 py-3 text-start font-normal">الكود</th>
                <th className="px-4 py-3 text-start font-normal">العميل</th>
                <th className="px-4 py-3 text-start font-normal">الحالة</th>
                <th className="px-4 py-3 text-start font-normal">على الموقع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {projects.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${project.id}`} className="hover:text-gold">
                      {project.title_ar}
                    </Link>
                    <span className="block text-xs text-ink/35">{project.compound ?? "—"}</span>
                  </td>
                  <td className="brand px-4 py-3 text-xs" dir="ltr">
                    {project.code}
                  </td>
                  {/* Read through the client_id relation, not duplicated here. */}
                  <td className="px-4 py-3 text-ink/70">
                    {project.clients ? (
                      <>
                        {project.clients.name}
                        <span className="block text-xs text-ink/35" dir="ltr">
                          {/^1\d{9}$/.test(project.clients.phone)
                            ? `0${project.clients.phone}`
                            : project.clients.phone}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {STATUS_LABEL[project.status] ?? project.status}
                  </td>
                  <td className="px-4 py-3">
                    {project.is_public && project.publish_approved_at ? (
                      <span className="text-green-700">معروض</span>
                    ) : (
                      <span className="text-ink/35">مخفي</span>
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
