"use client";

import { useActionState, useMemo, useState } from "react";

import {
  archiveClient,
  createClient,
  restoreClient,
  updateClient,
  type ClientFormState,
} from "@/app/admin/clients/actions";
import type { AdminClient } from "@/lib/adminData";
import { normalizePhone } from "@/lib/i18n";

const initial: ClientFormState = { error: null };

/** Display form of a stored (normalised) number: 1115134141 -> 01115134141 */
function displayPhone(phone: string): string {
  return /^1\d{9}$/.test(phone) ? `0${phone}` : phone;
}

export function ClientsTable({ clients }: { clients: AdminClient[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  // Matches on name or phone, and on the phone in any format the admin might
  // type it — the stored value is normalised, so "01115134141" must still hit.
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    const asPhone = normalizePhone(term);
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        (asPhone.length > 0 && client.phone.includes(asPhone)),
    );
  }, [clients, query]);

  return (
    <div className="space-y-8">
      <AddClientForm />

      <div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="دوّر بالاسم أو الرقم…"
          className="w-full max-w-md rounded-sharp border border-ink/15 bg-white px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
        />
        <p className="mt-2 text-xs text-ink/40">
          {filtered.length} من {clients.length}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-dashed border-ink/15 px-6 py-16 text-center text-sm text-ink/40">
          {clients.length === 0 ? "لسه مفيش عملاء." : "مفيش نتيجة للبحث ده."}
        </p>
      ) : (
        <div className="overflow-x-auto border border-ink/10 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-paper text-xs text-ink/50">
                <th className="px-4 py-3 text-start font-normal">الاسم</th>
                <th className="px-4 py-3 text-start font-normal">الموبايل</th>
                <th className="px-4 py-3 text-start font-normal">المشاريع</th>
                <th className="px-4 py-3 text-start font-normal">الحالة</th>
                <th className="px-4 py-3 text-start font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filtered.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  isEditing={editing === client.id}
                  onToggleEdit={() => setEditing(editing === client.id ? null : client.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ClientRow({
  client,
  isEditing,
  onToggleEdit,
}: {
  client: AdminClient;
  isEditing: boolean;
  onToggleEdit: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateClient.bind(null, client.id),
    initial,
  );
  const archived = Boolean(client.archived_at);

  if (isEditing) {
    return (
      <tr className="bg-gold/[0.04]">
        <td colSpan={5} className="px-4 py-4">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="block text-xs text-ink/50">الاسم</span>
              <input name="name" defaultValue={client.name} required className={input} />
            </label>
            <label className="block">
              <span className="block text-xs text-ink/50">الموبايل</span>
              <input
                name="phone"
                dir="ltr"
                defaultValue={displayPhone(client.phone)}
                required
                className={input}
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-sharp bg-ink px-6 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {pending ? "بيحفظ…" : "حفظ"}
            </button>
            <button
              type="button"
              onClick={onToggleEdit}
              className="rounded-sharp border border-ink/20 px-5 py-2.5 text-sm"
            >
              إلغاء
            </button>
            {state.error && (
              <p role="alert" className="w-full text-sm text-red-700">
                {state.error}
              </p>
            )}
            {state.savedAt && !state.error && (
              <span className="text-sm text-green-700">اتحفظ</span>
            )}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`transition-colors hover:bg-paper ${archived ? "text-ink/40" : ""}`}>
      <td className="px-4 py-3">{client.name}</td>
      <td className="px-4 py-3" dir="ltr">
        {displayPhone(client.phone)}
      </td>
      <td className="px-4 py-3">{client.projectCount}</td>
      <td className="px-4 py-3">
        {archived ? (
          <span className="text-ink/45">مؤرشف</span>
        ) : (
          <span className="text-green-700">نشط</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleEdit}
            className="rounded-sharp border border-ink/20 px-4 py-1.5 text-xs transition-colors hover:border-gold"
          >
            تعديل
          </button>
          {archived ? (
            <form action={restoreClient.bind(null, client.id)}>
              <button
                type="submit"
                className="rounded-sharp border border-ink/20 px-4 py-1.5 text-xs transition-colors hover:border-gold"
              >
                إرجاع
              </button>
            </form>
          ) : (
            <form action={archiveClient.bind(null, client.id)}>
              <button
                type="submit"
                title="بيخفيه من القايمة بس — كل مشاريعه وبياناته بتفضل زي ما هي، ودخوله لبوابة المتابعة مابيتأثرش"
                className="rounded-sharp border border-ink/20 px-4 py-1.5 text-xs transition-colors hover:border-gold"
              >
                أرشفة
              </button>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}

function AddClientForm() {
  const [state, formAction, pending] = useActionState(createClient, initial);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 border border-ink/10 bg-white p-5"
    >
      <label className="block">
        <span className="block text-xs text-ink/50">الاسم</span>
        <input name="name" required placeholder="اسم العميل" className={input} />
      </label>
      <label className="block">
        <span className="block text-xs text-ink/50">الموبايل</span>
        <input name="phone" dir="ltr" required placeholder="01xxxxxxxxx" className={input} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sharp bg-gold px-6 py-2.5 text-sm font-medium text-ink disabled:opacity-50"
      >
        {pending ? "بيضيف…" : "أضف عميل"}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.savedAt && !state.error && <span className="text-sm text-green-700">اتضاف</span>}
    </form>
  );
}

const input =
  "mt-1 rounded-sharp border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none";
