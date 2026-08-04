import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PrintButton } from "@/components/PrintButton";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, pick, type Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/finance";
import { getPortalData, getSessionProjectId } from "@/lib/portal";

export const dynamic = "force-dynamic";

/** Laid out like the paper statement it replaces. Print to get the PDF. */
export default async function StatementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const projectId = await getSessionProjectId();
  if (!projectId) redirect(`/${locale}/track`);

  const data = await getPortalData(projectId);
  if (!data) redirect(`/${locale}/track`);

  const { project, statement, expenses, payments } = data;
  const issuedAt = new Date().toISOString().slice(0, 10);
  const inCredit = statement.balance >= 0;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-[140px] print:pt-0">
      <div className="mb-8 flex gap-3 print:hidden">
        <PrintButton label={t.portal.print} />
        <Link
          href={`/${locale}/track/dashboard`}
          className="rounded-pill border border-ink px-6 py-3 text-sm transition-colors hover:border-gold"
        >
          {t.portal.tabs.expenses}
        </Link>
      </div>

      <article className="border border-ink/15 p-10 print:border-0 print:p-0">
        <header className="flex items-start justify-between border-b border-ink pb-6">
          <div>
            <p className="brand text-lg">Future Interiors</p>
            <h1 className="mt-2 text-xl">{t.portal.statementTitle}</h1>
          </div>
          <dl className="text-end text-xs text-ink/60">
            <dt className="inline">{t.portal.projectCode}: </dt>
            <dd className="brand inline" dir="ltr">
              {project.code}
            </dd>
            <br />
            <dt className="inline">{t.portal.issuedAt}: </dt>
            <dd className="inline" dir="ltr">
              {issuedAt}
            </dd>
          </dl>
        </header>

        <p className="mt-6 text-sm">{pick(project, "title", locale)}</p>

        <h2 className="mt-10 border-b border-ink/20 pb-2 text-sm tracking-widest text-ink/60">
          {t.portal.expensesSection}
        </h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-xs text-ink/45">
              <th className="py-2 text-start font-normal">{t.portal.columns.date}</th>
              <th className="py-2 text-start font-normal">{t.portal.columns.item}</th>
              <th className="py-2 text-end font-normal">{t.portal.columns.amount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {expenses.map((row) => (
              <tr key={row.id} className="break-inside-avoid">
                <td className="py-2 whitespace-nowrap text-ink/55" dir="ltr">
                  {row.date}
                </td>
                <td className="py-2">{pick(row, "item", locale)}</td>
                <td
                  className={`brand py-2 text-end whitespace-nowrap ${row.amount < 0 ? "text-green-700" : ""}`}
                  dir="ltr"
                >
                  {formatMoney(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-10 border-b border-ink/20 pb-2 text-sm tracking-widest text-ink/60">
          {t.portal.paymentsSection}
        </h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-xs text-ink/45">
              <th className="py-2 text-start font-normal">{t.portal.columns.date}</th>
              <th className="py-2 text-start font-normal">{t.portal.columns.label}</th>
              <th className="py-2 text-end font-normal">{t.portal.columns.amount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {payments.map((row) => (
              <tr key={row.id} className="break-inside-avoid">
                <td className="py-2 whitespace-nowrap text-ink/55" dir="ltr">
                  {row.date}
                </td>
                <td className="py-2">{pick(row, "label", locale)}</td>
                <td className="brand py-2 text-end whitespace-nowrap" dir="ltr">
                  {formatMoney(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-10 border-b border-ink/20 pb-2 text-sm tracking-widest text-ink/60">
          {t.portal.summarySection}
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <SummaryRow label={t.portal.totalCost} value={statement.total_cost} />
          <SummaryRow label={t.portal.supervisionFee} value={statement.supervision_fee} />
          <SummaryRow label={t.portal.grandTotal} value={statement.grand_total} strong />
          <SummaryRow label={t.portal.totalPayments} value={statement.total_payments} />
          <div className="flex justify-between border-t border-ink pt-3">
            <dt>
              {t.portal.balance}{" "}
              <span className="text-xs text-ink/55">
                ({inCredit ? t.portal.balanceCredit : t.portal.balanceDue})
              </span>
            </dt>
            <dd className={`brand ${inCredit ? "text-green-700" : "text-red-700"}`} dir="ltr">
              {formatMoney(Math.abs(statement.balance))} {t.portal.currency}
            </dd>
          </div>
        </dl>
      </article>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-medium" : ""}`}>
      <dt>{label}</dt>
      <dd className="brand" dir="ltr">
        {formatMoney(value)}
      </dd>
    </div>
  );
}
