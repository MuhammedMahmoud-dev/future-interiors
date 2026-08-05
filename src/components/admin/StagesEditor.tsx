"use client";

import { useState, useTransition } from "react";
import { setStageStatus } from "@/app/admin/projects/actions";

type Stage = { id: string; name_ar: string };

const OPTIONS = [
  { value: "not_started", label: "لسه ما بدأش" },
  { value: "in_progress", label: "جاري التنفيذ" },
  { value: "done", label: "تم" },
];

/**
 * Stage status drives the client's progress bar automatically — the percentage
 * is derived from these values, never typed in by hand.
 */
export function StagesEditor({
  projectId,
  stages,
  initialProgress,
  initialNotes,
}: {
  projectId: string;
  stages: Stage[];
  initialProgress: Record<string, string>;
  initialNotes: Record<string, string>;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [notes, setNotes] = useState(initialNotes);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const persist = (stageId: string, status: string, note: string) => {
    setSavingId(stageId);
    startTransition(async () => {
      try {
        await setStageStatus(projectId, stageId, status, note);
      } finally {
        setSavingId(null);
      }
    });
  };

  const done = stages.filter((stage) => progress[stage.id] === "done").length;
  const percent = stages.length > 0 ? Math.round((done / stages.length) * 100) : 0;

  return (
    <div>
      <div className="mb-8 border border-border bg-white p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">التقدم اللي بيشوفه العميل</span>
          <span className="brand text-2xl" dir="ltr">
            {percent}%
          </span>
        </div>
        <div className="mt-4 h-1 w-full bg-ink/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <ul className="divide-y divide-border border border-border bg-white">
        {stages.map((stage, index) => (
          <li key={stage.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-center gap-4">
              <span className="brand text-xs text-accent">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex-1">
                <p>{stage.name_ar}</p>
                <input
                  type="text"
                  value={notes[stage.id] ?? ""}
                  placeholder="ملاحظة تظهر للعميل (اختياري)"
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [stage.id]: event.target.value }))
                  }
                  onBlur={(event) =>
                    persist(stage.id, progress[stage.id] ?? "not_started", event.target.value)
                  }
                  className="mt-2 w-full border-b border-transparent bg-transparent py-1 text-xs text-muted placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {savingId === stage.id && <span className="text-xs text-muted">بيحفظ…</span>}
              <select
                value={progress[stage.id] ?? "not_started"}
                onChange={(event) => {
                  const status = event.target.value;
                  setProgress((current) => ({ ...current, [stage.id]: status }));
                  persist(stage.id, status, notes[stage.id] ?? "");
                }}
                className="rounded-card border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                {OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
