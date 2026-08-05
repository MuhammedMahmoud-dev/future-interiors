"use client";

import { useMemo, useState } from "react";
import { normalizePhone } from "@/lib/i18n";

export type PickerClient = { id: string; name: string; phone: string };

/** Display form of a stored (normalised) number: 1115134141 -> 01115134141 */
function displayPhone(phone: string): string {
  return /^1\d{9}$/.test(phone) ? `0${phone}` : phone;
}

/**
 * Attach a project to a client — an existing one, or a new one created inline.
 *
 * The list is filtered in memory rather than through an async combobox: this is
 * one firm's client book, not a directory, and a round trip per keystroke would
 * buy nothing.
 *
 * Entering a phone that already belongs to a client links to that client
 * instead of failing on the unique index — a returning client with a second
 * apartment is exactly the case this whole table exists for.
 */
export function ClientPicker({
  clients,
  currentClientId,
  currentClientLabel,
}: {
  clients: PickerClient[];
  currentClientId?: string | null;
  currentClientLabel?: string | null;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>(currentClientId ?? "");

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

  const chosen = clients.find((client) => client.id === selected);

  return (
    <div className="sm:col-span-2">
      <div className="mb-4 flex gap-2">
        <ModeButton active={mode === "existing"} onClick={() => setMode("existing")}>
          عميل موجود
        </ModeButton>
        <ModeButton active={mode === "new"} onClick={() => setMode("new")}>
          عميل جديد
        </ModeButton>
      </div>

      {mode === "existing" ? (
        <div>
          {/* Carries the choice to the server action. */}
          <input type="hidden" name="client_id" value={selected} />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="دوّر بالاسم أو الرقم…"
            className={input}
          />

          {clients.length === 0 ? (
            <p className="mt-3 text-xs text-muted">
              مفيش عملاء نشطين لسه — استخدم &quot;عميل جديد&quot;.
            </p>
          ) : (
            <ul className="mt-3 max-h-56 divide-y divide-border overflow-y-auto border border-border bg-white">
              {filtered.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(client.id)}
                    className={`flex w-full items-baseline justify-between gap-4 px-4 py-2.5 text-start text-sm transition-colors hover:bg-surface ${
                      selected === client.id ? "bg-accent/10" : ""
                    }`}
                  >
                    <span>{client.name}</span>
                    <span className="text-xs text-muted" dir="ltr">
                      {displayPhone(client.phone)}
                    </span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-xs text-muted">مفيش نتيجة.</li>
              )}
            </ul>
          )}

          <p className="mt-2 text-xs text-muted">
            {chosen
              ? `المختار: ${chosen.name}`
              : currentClientLabel
                ? `المربوط حالياً: ${currentClientLabel}`
                : "اختر عميل من القايمة."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-xs text-muted">اسم العميل</span>
            <input name="new_client_name" placeholder="الاسم بالكامل" className={input} />
          </label>
          <label className="block">
            <span className="block text-xs text-muted">موبايل العميل</span>
            <input name="new_client_phone" dir="ltr" placeholder="01xxxxxxxxx" className={input} />
          </label>
          <p className="text-xs text-muted sm:col-span-2">
            لو الرقم ده مسجّل لعميل موجود، المشروع هيتربط بيه بدل ما يتعمل عميل مكرر.
          </p>
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-card border px-5 py-2 text-sm transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-border text-muted hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

const input =
  "mt-1 w-full rounded-card border border-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none";
