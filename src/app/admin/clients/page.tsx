import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";
import { ClientsTable } from "@/components/admin/ClientsTable";
import { requireAdmin } from "@/lib/admin";
import { listClients } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  await requireAdmin();

  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const clients = await listClients({ includeArchived: showArchived });

  return (
    <AdminShell
      title="العملاء"
      action={
        <Link
          href={showArchived ? "/admin/clients" : "/admin/clients?archived=1"}
          className="rounded-pill border border-border px-5 py-2.5 text-sm transition-colors hover:border-ink"
        >
          {showArchived ? "النشطين بس" : "اعرض المؤرشفين كمان"}
        </Link>
      }
    >
      <p className="mb-6 max-w-2xl text-sm leading-7 text-muted">
        العميل الواحد ممكن يكون له أكتر من مشروع. الأرشفة بتخفيه من القايمة دي بس — بياناته
        ومشاريعه بتفضل محفوظة بالكامل، وبيفضل يقدر يفتح صفحة متابعة مشروعه بالكود ورقمه عادي.
      </p>

      <ClientsTable clients={clients} />
    </AdminShell>
  );
}
