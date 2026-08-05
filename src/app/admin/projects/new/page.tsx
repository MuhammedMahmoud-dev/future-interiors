import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { requireAdmin } from "@/lib/admin";
import { listClients } from "@/lib/adminData";
import { createProject } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  await requireAdmin();
  // Active clients only — an archived one is not offered for new work.
  const clients = await listClients();

  return (
    <AdminShell title="مشروع جديد">
      <p className="mb-8 text-sm text-muted">
        كود المتابعة بيتولد أوتوماتيك بعد الحفظ — هتلاقيه في صفحة المشروع وتبعته للعميل على واتساب.
      </p>
      <ProjectForm action={createProject} submitLabel="إنشاء المشروع" clients={clients} />
    </AdminShell>
  );
}
