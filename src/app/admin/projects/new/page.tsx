import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { requireAdmin } from "@/lib/admin";
import { createProject } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <AdminShell title="مشروع جديد">
      <p className="mb-8 text-sm text-ink/50">
        كود المتابعة بيتولد أوتوماتيك بعد الحفظ — هتلاقيه في صفحة المشروع وتبعته للعميل على واتساب.
      </p>
      <ProjectForm action={createProject} submitLabel="إنشاء المشروع" />
    </AdminShell>
  );
}
