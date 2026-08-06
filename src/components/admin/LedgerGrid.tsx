"use client";

import { useCallback, useEffect, useState } from "react";

import {
  deleteLedgerRow,
  saveLedger,
  type LedgerKind,
  type LedgerRow,
} from "@/app/admin/projects/actions";
import { parseAmount, formatMoney } from "@/lib/finance";
import { parseDateInput } from "@/lib/format";

/**
 * Spreadsheet-style ledger entry.
 *
 * An apartment runs to 100+ line items, so this is a grid of plain inputs, not
 * a modal per row: Enter opens the next row, a block paste from Excel fills
 * many rows at once, edits autosave, and delete is one click.
 */

type Stage = { id: string; name_ar: string };

const AUTOSAVE_MS = 900;

let keyCounter = 0;
const nextKey = () => `row-${++keyCounter}`;

function blankRow(): LedgerRow {
  return { key: nextKey(), id: null, date: "", text: "", amount: "", stageId: null };
}

export function LedgerGrid({
  projectId,
  kind,
  initialRows,
  stages,
}: {
  projectId: string;
  kind: LedgerKind;
  initialRows: LedgerRow[];
  stages: Stage[];
}) {
  const [rows, setRows] = useState<LedgerRow[]>(() =>
    initialRows.length > 0 ? initialRows : [blankRow()],
  );
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const save = useCallback(async (pending: LedgerRow[]) => {
    if (pending.length === 0) return;

    setState("saving");
    setMessage(null);
    try {
      const saved = await saveLedger(projectId, kind, pending);

      setRows((existing) =>
        existing.map((row) => {
          const match = saved.find((entry) => entry.key === row.key);
          return match ? { ...row, id: match.id } : row;
        }),
      );
      setDirty((existing) => {
        const remaining = new Set(existing);
        for (const row of pending) remaining.delete(row.key);
        return remaining;
      });
      setState("saved");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "الحفظ فشل");
    }
  }, [projectId, kind]);

  // Re-runs on every edit, so the timer always closes over the newest rows.
  useEffect(() => {
    if (dirty.size === 0) return;
    const timer = setTimeout(() => {
      void save(rows.filter((row) => dirty.has(row.key)));
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [dirty, rows, save]);

  const markDirty = (key: string) =>
    setDirty((existing) => {
      const next = new Set(existing);
      next.add(key);
      return next;
    });

  const update = (key: string, patch: Partial<LedgerRow>) => {
    setRows((existing) => existing.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    markDirty(key);
  };

  const addRow = (afterKey?: string) => {
    const fresh = blankRow();
    setRows((existing) => {
      if (!afterKey) return [...existing, fresh];
      const index = existing.findIndex((row) => row.key === afterKey);
      const copy = [...existing];
      copy.splice(index + 1, 0, fresh);
      return copy;
    });
    return fresh.key;
  };

  const removeRow = async (row: LedgerRow) => {
    setRows((existing) => {
      const remaining = existing.filter((entry) => entry.key !== row.key);
      return remaining.length > 0 ? remaining : [blankRow()];
    });
    setDirty((existing) => {
      const next = new Set(existing);
      next.delete(row.key);
      return next;
    });
    if (row.id) {
      try {
        await deleteLedgerRow(kind, row.id);
      } catch {
        setState("error");
        setMessage("الحذف فشل — حدّث الصفحة");
      }
    }
  };

  /**
   * Block paste from Excel. A single cell falls through to normal paste; a
   * multi-cell block is split on tabs and newlines and expanded into rows,
   * starting at the row that was pasted into.
   */
  const handlePaste = (event: React.ClipboardEvent, rowKey: string) => {
    const clipboard = event.clipboardData.getData("text/plain");
    if (!clipboard.includes("\t") && !clipboard.includes("\n")) return;

    event.preventDefault();

    const lines = clipboard.split(/\r?\n/).filter((line) => line.trim() !== "");
    const parsed = lines.map((line) => line.split("\t").map((cell) => cell.trim()));

    const incoming: LedgerRow[] = parsed.map((cells) => {
      // 3+ columns: date, description, amount. 2: description, amount. 1: description.
      let date = "";
      let text = "";
      let amount = "";

      if (cells.length >= 3) {
        date = parseDateInput(cells[0]) ?? "";
        text = cells[1] ?? "";
        amount = cells[2] ?? "";
      } else if (cells.length === 2) {
        text = cells[0];
        amount = cells[1];
      } else {
        text = cells[0];
      }

      return { key: nextKey(), id: null, date, text, amount, stageId: null };
    });

    setRows((existing) => {
      const index = existing.findIndex((row) => row.key === rowKey);
      const target = existing[index];
      const targetIsEmpty = !target.text && !target.amount && !target.id;

      const copy = [...existing];
      copy.splice(index, targetIsEmpty ? 1 : 0, ...incoming);
      return copy;
    });

    setDirty((existing) => {
      const next = new Set(existing);
      for (const row of incoming) next.add(row.key);
      return next;
    });
  };

  const onKeyDown = (event: React.KeyboardEvent, rowKey: string) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const newKey = addRow(rowKey);
    // Focus the description cell of the new row once it exists.
    requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>(`[data-cell="${newKey}-text"]`)?.focus();
    });
  };

  const total = rows.reduce((sum, row) => sum + (parseAmount(row.amount) ?? 0), 0);
  const isExpenses = kind === "expenses";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-muted-ink">
          Enter بيفتح سطر جديد · تقدر تلصق عمود كامل من إكسل · الحفظ تلقائي
        </p>
        <SaveIndicator state={state} message={message} />
      </div>

      <div className="overflow-x-auto border border-border bg-white">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-start text-xs text-muted-ink">
              <th className="w-32 border-b border-border px-3 py-2 text-start font-normal">التاريخ</th>
              <th className="border-b border-border px-3 py-2 text-start font-normal">
                {isExpenses ? "البند" : "الدفعة"}
              </th>
              {isExpenses && (
                <th className="w-40 border-b border-border px-3 py-2 text-start font-normal">
                  المرحلة
                </th>
              )}
              <th className="w-36 border-b border-border px-3 py-2 text-start font-normal">المبلغ</th>
              <th className="w-10 border-b border-border" />
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const amount = parseAmount(row.amount);
              const invalid = row.amount.trim() !== "" && amount === null;
              return (
                <tr key={row.key} className="border-b border-border last:border-0">
                  <td className="p-0">
                    <input
                      type="date"
                      value={row.date}
                      data-cell={`${row.key}-date`}
                      onChange={(event) => update(row.key, { date: event.target.value })}
                      onKeyDown={(event) => onKeyDown(event, row.key)}
                      onPaste={(event) => handlePaste(event, row.key)}
                      className="w-full bg-transparent px-3 py-2 focus:bg-accent/5"
                    />
                  </td>

                  <td className="p-0">
                    <input
                      type="text"
                      value={row.text}
                      data-cell={`${row.key}-text`}
                      placeholder={isExpenses ? "اسم البند" : "وصف الدفعة"}
                      onChange={(event) => update(row.key, { text: event.target.value })}
                      onKeyDown={(event) => onKeyDown(event, row.key)}
                      onPaste={(event) => handlePaste(event, row.key)}
                      className="w-full bg-transparent px-3 py-2 placeholder:text-muted-ink focus:bg-accent/5"
                    />
                  </td>

                  {isExpenses && (
                    <td className="p-0">
                      <select
                        value={row.stageId ?? ""}
                        onChange={(event) =>
                          update(row.key, { stageId: event.target.value || null })
                        }
                        className="w-full bg-transparent px-3 py-2 text-muted-ink focus:bg-accent/5"
                      >
                        <option value="">—</option>
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.name_ar}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}

                  <td className="p-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      value={row.amount}
                      data-cell={`${row.key}-amount`}
                      placeholder="0"
                      onChange={(event) => update(row.key, { amount: event.target.value })}
                      onKeyDown={(event) => onKeyDown(event, row.key)}
                      onPaste={(event) => handlePaste(event, row.key)}
                      className={`w-full bg-transparent px-3 py-2 text-end placeholder:text-muted-ink focus:bg-accent/5 ${
                        invalid ? "text-red-600" : amount !== null && amount < 0 ? "text-green-700" : ""
                      }`}
                    />
                  </td>

                  <td className="p-0 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row)}
                      aria-label="حذف السطر"
                      className="px-2 py-2 text-muted-ink transition-colors hover:text-red-600"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-surface">
              <td colSpan={isExpenses ? 3 : 2} className="px-3 py-3 text-xs text-muted-ink">
                {rows.filter((row) => row.text.trim()).length} سطر
              </td>
              <td className="px-3 py-3 text-end" dir="ltr">
                {formatMoney(total)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        type="button"
        onClick={() => addRow()}
        className="mt-4 rounded-pill border border-border px-5 py-2.5 text-sm transition-colors hover:border-ink"
      >
        + سطر جديد
      </button>
    </div>
  );
}

function SaveIndicator({
  state,
  message,
}: {
  state: "idle" | "saving" | "saved" | "error";
  message: string | null;
}) {
  if (state === "error") {
    return (
      <span role="alert" className="text-red-600">
        {message ?? "الحفظ فشل"}
      </span>
    );
  }
  if (state === "saving") return <span className="text-muted-ink">بيحفظ…</span>;
  if (state === "saved") return <span className="text-green-700">اتحفظ</span>;
  return <span className="text-transparent">.</span>;
}
