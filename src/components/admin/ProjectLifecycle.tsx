"use client";

import { useActionState, useState } from "react";
import { deleteProject, setProjectArchived, type DeleteProjectState } from "@/app/admin/projects/actions";

const initial: DeleteProjectState = { error: null };

/**
 * Retiring a project.
 *
 * Archiving leads, because it is what almost every case actually is: the work
 * finished and the list wants tidying. Deleting is for the rarer "I typed this
 * in by mistake", so it sits behind a disclosure rather than next to the button
 * someone reaches for weekly.
 *
 * The delete form is always rendered, even when the ledger makes it impossible.
 * Two reasons: the engineer gets told WHY instead of hunting for a missing
 * button, and the endpoint stays exercisable so a test can prove the server
 * refuses on its own rather than relying on a hidden control.
 */
export function ProjectLifecycle({
  id,
  code,
  archivedAt,
  expenseCount,
  paymentCount,
}: {
  id: string;
  code: string;
  archivedAt: string | null;
  expenseCount: number;
  paymentCount: number;
}) {
  const [state, formAction, pending] = useActionState(deleteProject, initial);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const archived = Boolean(archivedAt);
  const hasLedger = expenseCount > 0 || paymentCount > 0;
  const codeMatches = typed.trim().toUpperCase() === code.toUpperCase();

  return (
    <section className="mt-10 border-t border-border pt-8">
      {/* ---- the ordinary case, and the one that looks like it ---- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            {archived ? "المشروع مؤرشف" : "أرشفة المشروع"}
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-6 text-muted-ink">
            {archived
              ? "مخفي من قايمة المشاريع. لسه ظاهر في المعرض لو منشور، والعميل لسه بيقدر يفتح البوابة."
              : "بيخفيه من القايمة بس. مابيأثرش على المعرض ولا على وصول العميل للبوابة."}
          </p>
        </div>

        <form action={setProjectArchived.bind(null, id, !archived)}>
          <button
            type="submit"
            className="rounded-pill bg-ink px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {archived ? "استرجاع المشروع" : "أرشفة المشروع"}
          </button>
        </form>
      </div>

      {/* ---- the exception, deliberately quieter ---- */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-xs text-muted-ink underline underline-offset-4 hover:text-ink"
          aria-expanded={open}
        >
          حذف المشروع نهائياً
        </button>

        {open && (
          <div className="mt-4 max-w-xl rounded-card border border-red-200 bg-red-50/60 p-5">
            <p className="text-xs leading-6 text-red-800">
              {hasLedger ? (
                <>
                  المشروع ده فيه <strong>{expenseCount}</strong> بند و
                  <strong> {paymentCount}</strong> دفعة. ده سجل مالي، والحذف
                  هيترفض — الأرشفة هي الطريقة الصح إنك تخفيه.
                </>
              ) : (
                <>
                  الحذف نهائي ومايترجعش. المشروع مفيهوش بنود ولا دفعات، فمفيش
                  سجل مالي هيضيع — بس كود المتابعة هيتسجل في سجل الحذف.
                </>
              )}
            </p>

            <p className="mt-3 text-xs text-red-800">
              اكتب كود المشروع <code className="brand">{code}</code> عشان تأكد:
            </p>

            {/*
              The form stays even when the counts above say it will fail. The
              refusal belongs to the server — these numbers were read when the
              page rendered and a row could have landed since. Letting the
              submit through returns the real reason instead of a guess, and
              keeps the endpoint reachable so a test can prove the server
              refuses on its own rather than trusting a hidden button.
            */}
            <form action={formAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={id} />
              <input
                name="confirm"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                dir="ltr"
                autoComplete="off"
                placeholder={code}
                aria-label="كود المشروع للتأكيد"
                className="brand rounded-card border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!codeMatches || pending}
                className="rounded-pill bg-red-700 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? "بيتحذف…" : "احذف نهائياً"}
              </button>
            </form>

            {state.error && (
              <p role="alert" className="mt-3 text-xs font-medium text-red-900">
                {state.error}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
