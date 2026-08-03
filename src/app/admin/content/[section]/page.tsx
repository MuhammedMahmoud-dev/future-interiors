import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { RecordEditor } from "@/components/admin/RecordEditor";
import { requireAdmin } from "@/lib/admin";
import { listRecords } from "@/lib/adminData";
import { getContentSpec, isContentKey } from "@/lib/contentSchema";

export const dynamic = "force-dynamic";

/** One route for services, faqs, testimonials, stats and the engineer profile. */
export default async function ContentSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requireAdmin();

  const { section } = await params;
  if (!isContentKey(section)) notFound();

  const spec = getContentSpec(section);
  const records = await listRecords(spec.table, spec.orderBy);

  return (
    <AdminShell title={spec.label}>
      <RecordEditor contentKey={section} spec={spec} records={records} />
    </AdminShell>
  );
}
