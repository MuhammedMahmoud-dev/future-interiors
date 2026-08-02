import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StatementTabs, type PhotoGroup } from "@/components/StatementTabs";
import { logout } from "../actions";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, pick, whatsappLink, type Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/finance";
import { signMedia } from "@/lib/media";
import { getPortalData, getSessionProjectId } from "@/lib/portal";
import { getWhatsappNumber } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  // The project is derived from the signed cookie, never from anything the
  // client can supply.
  const projectId = await getSessionProjectId();
  if (!projectId) redirect(`/${locale}/track`);

  const data = await getPortalData(projectId);
  if (!data) redirect(`/${locale}/track`);

  const whatsapp = await getWhatsappNumber();
  const { project, statement, expenses, payments, stages, media, progress } = data;

  const signed = await signMedia(media.map((item) => item.url));
  const stageName = (id: string | null) =>
    id ? (stages.find((stage) => stage.id === id) ?? null) : null;

  const photoGroups: PhotoGroup[] = [
    ...stages.map((stage) => ({
      id: stage.id,
      stage: pick(stage, "name", locale),
      photos: media
        .filter((item) => item.stage_id === stage.id)
        .map((item) => ({
          id: item.id,
          url: signed.get(item.url) ?? "",
          caption: pick(item, "caption", locale),
        }))
        .filter((photo) => photo.url),
    })),
    {
      id: "unassigned",
      stage: t.portal.unassignedStage,
      photos: media
        .filter((item) => !item.stage_id || !stageName(item.stage_id))
        .map((item) => ({
          id: item.id,
          url: signed.get(item.url) ?? "",
          caption: pick(item, "caption", locale),
        }))
        .filter((photo) => photo.url),
    },
  ].filter((group) => group.photos.length > 0);

  const inCredit = statement.balance >= 0;
  const statusLabel =
    t.portal.status[project.status as keyof typeof t.portal.status] ?? project.status;

  return (
    <div className="pt-[100px]">
      {/* Header — masked title only, never the unit or building number */}
      <header className="bg-ink py-12 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-gold">{statusLabel}</p>
              <h1 className="mt-3 text-2xl sm:text-3xl">{pick(project, "title", locale)}</h1>
              <p className="brand mt-2 text-xs text-white/40" dir="ltr">
                {project.code}
              </p>
            </div>

            <form action={logout}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="rounded-sharp border border-white/25 px-5 py-2.5 text-xs text-white/70 transition-colors hover:border-gold hover:text-gold"
              >
                {t.portal.logout}
              </button>
            </form>
          </div>

          {/* Progress is derived from the stage rows, never typed in by hand */}
          {stages.length > 0 && (
            <div className="mt-10">
              <div className="flex items-baseline justify-between text-xs text-white/50">
                <span>{t.portal.progress}</span>
                <span className="brand" dir="ltr">
                  {progress}%
                </span>
              </div>
              <div className="mt-3 h-px w-full bg-white/15">
                <div className="h-px bg-gold" style={{ width: `${progress}%` }} />
              </div>
              <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                {stages.map((stage) => (
                  <li
                    key={stage.id}
                    className={
                      stage.status === "done"
                        ? "text-gold"
                        : stage.status === "in_progress"
                          ? "text-white/80"
                          : "text-white/30"
                    }
                  >
                    {pick(stage, "name", locale)}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </header>

      {/* Money bar. The supervision fee is an amount; the rate itself is never sent. */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 py-10 sm:px-6 lg:grid-cols-5">
          <Figure label={t.portal.totalCost} value={statement.total_cost} currency={t.portal.currency} />
          <Figure
            label={t.portal.supervisionFee}
            value={statement.supervision_fee}
            currency={t.portal.currency}
          />
          <Figure label={t.portal.grandTotal} value={statement.grand_total} currency={t.portal.currency} />
          <Figure
            label={t.portal.totalPayments}
            value={statement.total_payments}
            currency={t.portal.currency}
          />
          <div className="px-3 py-2">
            <p className="text-xs text-ink/40">{t.portal.balance}</p>
            <p
              className={`brand mt-2 text-xl ${inCredit ? "text-green-600" : "text-red-600"}`}
              dir="ltr"
            >
              {formatMoney(Math.abs(statement.balance))}
            </p>
            <p className="mt-1 text-xs text-ink/45">
              {inCredit ? t.portal.balanceCredit : t.portal.balanceDue}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/track/statement`}
              className="rounded-sharp bg-ink px-6 py-3 text-sm text-white transition-opacity hover:opacity-90"
            >
              {t.portal.downloadPdf}
            </Link>
            <a
              href={whatsappLink(whatsapp, t.portal.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sharp border border-ink px-6 py-3 text-sm transition-colors hover:border-gold hover:text-gold"
            >
              {t.portal.contactEngineer}
            </a>
          </div>

          <StatementTabs
            expenses={expenses.map((row) => ({
              id: row.id,
              date: row.date,
              item: pick(row, "item", locale),
              amount: row.amount,
            }))}
            payments={payments.map((row) => ({
              id: row.id,
              date: row.date,
              label: pick(row, "label", locale),
              amount: row.amount,
            }))}
            photoGroups={photoGroups}
            t={t.portal}
          />
        </div>
      </section>
    </div>
  );
}

function Figure({ label, value, currency }: { label: string; value: number; currency: string }) {
  return (
    <div className="px-3 py-2">
      <p className="text-xs text-ink/40">{label}</p>
      <p className="brand mt-2 text-xl" dir="ltr">
        {formatMoney(value)}
      </p>
      <p className="mt-1 text-xs text-ink/45">{currency}</p>
    </div>
  );
}
