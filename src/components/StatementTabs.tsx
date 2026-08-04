"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/finance";

export type ExpenseRow = { id: string; date: string; item: string; amount: number };
export type PaymentRow = { id: string; date: string; label: string; amount: number };
export type PhotoGroup = { id: string; stage: string; photos: { id: string; url: string; caption: string }[] };

type Strings = {
  tabs: { expenses: string; payments: string; photos: string };
  search: string;
  dateFrom: string;
  dateTo: string;
  subtotal: string;
  showing: string;
  columns: { date: string; item: string; amount: string; label: string };
  noExpenses: string;
  noPayments: string;
  noPhotos: string;
  noResults: string;
  currency: string;
};

type Tab = "expenses" | "payments" | "photos";

export function StatementTabs({
  expenses,
  payments,
  photoGroups,
  t,
}: {
  expenses: ExpenseRow[];
  payments: PaymentRow[];
  photoGroups: PhotoGroup[];
  t: Strings;
}) {
  const [tab, setTab] = useState<Tab>("expenses");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return expenses.filter((row) => {
      if (needle && !row.item.toLowerCase().includes(needle)) return false;
      if (from && row.date < from) return false;
      if (to && row.date > to) return false;
      return true;
    });
  }, [expenses, query, from, to]);

  // Live subtotal of exactly what is on screen, so filtering stays honest.
  const subtotal = useMemo(
    () => filtered.reduce((total, row) => total + row.amount, 0),
    [filtered],
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "expenses", label: t.tabs.expenses },
    { key: "payments", label: t.tabs.payments },
    { key: "photos", label: t.tabs.photos },
  ];

  return (
    <div>
      <div role="tablist" className="flex border-b border-ink/10">
        {tabs.map((item) => (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`-mb-px border-b-2 px-6 py-4 text-sm transition-colors ${
              tab === item.key
                ? "border-gold text-ink"
                : "border-transparent text-ink/45 hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "expenses" && (
        <div className="pt-8">
          {expenses.length === 0 ? (
            <Empty message={t.noExpenses} />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.search}
                  aria-label={t.search}
                  className="rounded-card border border-ink/15 px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
                <input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  aria-label={t.dateFrom}
                  className="rounded-card border border-ink/15 px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
                <input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  aria-label={t.dateTo}
                  className="rounded-card border border-ink/15 px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-y border-ink/10 py-3 text-sm">
                <span className="text-ink/45">
                  {filtered.length} {t.showing}
                </span>
                <span>
                  {t.subtotal}:{" "}
                  <strong className="brand" dir="ltr">
                    {formatMoney(subtotal)}
                  </strong>{" "}
                  <span className="text-ink/45">{t.currency}</span>
                </span>
              </div>

              {filtered.length === 0 ? (
                <Empty message={t.noResults} />
              ) : (
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr className="text-start text-xs text-ink/40">
                      <th className="py-3 text-start font-normal">{t.columns.date}</th>
                      <th className="py-3 text-start font-normal">{t.columns.item}</th>
                      <th className="py-3 text-end font-normal">{t.columns.amount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {filtered.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 whitespace-nowrap text-ink/50" dir="ltr">
                          {row.date}
                        </td>
                        <td className="py-3">{row.item}</td>
                        <td
                          // Negative amounts are discounts — shown in green, not as errors.
                          className={`brand py-3 text-end whitespace-nowrap ${
                            row.amount < 0 ? "text-green-600" : ""
                          }`}
                          dir="ltr"
                        >
                          {formatMoney(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="pt-8">
          {payments.length === 0 ? (
            <Empty message={t.noPayments} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-ink/40">
                  <th className="py-3 text-start font-normal">{t.columns.date}</th>
                  <th className="py-3 text-start font-normal">{t.columns.label}</th>
                  <th className="py-3 text-end font-normal">{t.columns.amount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {payments.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 whitespace-nowrap text-ink/50" dir="ltr">
                      {row.date}
                    </td>
                    <td className="py-3">{row.label}</td>
                    <td className="brand py-3 text-end whitespace-nowrap" dir="ltr">
                      {formatMoney(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "photos" && (
        <div className="pt-8">
          {photoGroups.length === 0 ? (
            <Empty message={t.noPhotos} />
          ) : (
            <div className="space-y-10">
              {photoGroups.map((group) => (
                <section key={group.id}>
                  <h3 className="border-s-2 border-gold ps-3 text-sm">{group.stage}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {group.photos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square overflow-hidden bg-ink/5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- signed URLs */}
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p className="border border-dashed border-ink/15 px-6 py-16 text-center text-sm text-ink/40">
      {message}
    </p>
  );
}
