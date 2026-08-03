import { AdminShell } from "@/components/admin/AdminShell";
import { RecordEditor } from "@/components/admin/RecordEditor";
import { requireAdmin } from "@/lib/admin";
import { listRecords } from "@/lib/adminData";
import { getContentSpec } from "@/lib/contentSchema";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  await requireAdmin();

  const spec = getContentSpec("leads");
  const records = await listRecords(spec.table, spec.orderBy);

  return (
    <AdminShell title={spec.label}>
      <RecordEditor contentKey="leads" spec={spec} records={records} />
    </AdminShell>
  );
}
