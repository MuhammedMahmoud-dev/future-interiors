"use client";

import { useState, useTransition } from "react";

import { deleteContentRecord, saveContentRecord } from "@/app/admin/content/actions";
import type { ContentSpec, FieldSpec } from "@/lib/contentSchema";

type Record_ = Record<string, unknown>;

/**
 * One editor driving every content table. Each record is a small card of fields
 * described by CONTENT_SPECS, saved individually so a mistake in one row cannot
 * take the others down with it.
 */
export function RecordEditor({
  contentKey,
  spec,
  records,
}: {
  contentKey: string;
  spec: ContentSpec;
  records: Record_[];
}) {
  const [rows, setRows] = useState<Record_[]>(() =>
    spec.singleton && records.length === 0 ? [{}] : records,
  );

  const addRow = () => setRows((current) => [...current, {}]);

  return (
    <div>
      <p className="mb-6 text-sm text-ink/50">{spec.description}</p>

      <div className="space-y-5">
        {rows.map((record, index) => (
          <RecordCard
            key={(record.id as string) ?? `new-${index}`}
            contentKey={contentKey}
            spec={spec}
            record={record}
            onRemoved={() =>
              setRows((current) => current.filter((_, position) => position !== index))
            }
          />
        ))}
      </div>

      {!spec.singleton && (
        <button
          type="button"
          onClick={addRow}
          className="mt-6 rounded-sharp border border-ink/20 px-6 py-2.5 text-sm transition-colors hover:border-gold"
        >
          + إضافة
        </button>
      )}

      {rows.length === 0 && (
        <p className="border border-dashed border-ink/15 px-6 py-16 text-center text-sm text-ink/40">
          لسه مفيش محتوى هنا.
        </p>
      )}
    </div>
  );
}

function RecordCard({
  contentKey,
  spec,
  record,
  onRemoved,
}: {
  contentKey: string;
  spec: ContentSpec;
  record: Record_;
  onRemoved: () => void;
}) {
  const [id, setId] = useState<string | null>((record.id as string) ?? null);
  const [values, setValues] = useState<Record<string, string | boolean>>(() => seed(spec, record));
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, startTransition] = useTransition();

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveContentRecord(contentKey, id, values);
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      if (result.id) setId(result.id);
      setMessage({ kind: "ok", text: "اتحفظ" });
    });
  };

  const remove = () => {
    startTransition(async () => {
      if (id) {
        const result = await deleteContentRecord(contentKey, id);
        if (result.error) {
          setMessage({ kind: "error", text: result.error });
          return;
        }
      }
      onRemoved();
    });
  };

  return (
    <div className="border border-ink/10 bg-white p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {spec.fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(next) => setValues((current) => ({ ...current, [field.name]: next }))}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4 border-t border-ink/10 pt-4">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-sharp bg-ink px-6 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "بيحفظ…" : "حفظ"}
        </button>

        {!spec.singleton && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-sm text-ink/40 transition-colors hover:text-red-600"
          >
            حذف
          </button>
        )}

        {message && (
          <span
            role={message.kind === "error" ? "alert" : undefined}
            className={`text-sm ${message.kind === "error" ? "text-red-600" : "text-green-700"}`}
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}

function seed(spec: ContentSpec, record: Record_): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const field of spec.fields) {
    const raw = record[field.name];
    if (field.type === "boolean") {
      values[field.name] = raw === undefined ? true : Boolean(raw);
    } else if (field.type === "list") {
      values[field.name] = Array.isArray(raw) ? raw.join("\n") : "";
    } else {
      values[field.name] = raw === null || raw === undefined ? "" : String(raw);
    }
  }
  return values;
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: string | boolean | undefined;
  onChange: (next: string | boolean) => void;
}) {
  const base =
    "w-full rounded-sharp border border-ink/15 bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none";
  const wide = field.type === "textarea" || field.type === "list";

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-[#c6a664]"
        />
        {field.label}
      </label>
    );
  }

  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs text-ink/50">
        {field.label}
        {field.required && <span className="text-gold"> *</span>}
      </span>
      <div className="mt-2">
        {field.type === "textarea" || field.type === "list" ? (
          <textarea
            rows={field.type === "list" ? 4 : 3}
            dir={field.dir}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(event) => onChange(event.target.value)}
            className={base}
          />
        ) : (
          <input
            type={field.type === "number" ? "text" : "text"}
            inputMode={field.type === "number" ? "decimal" : undefined}
            dir={field.dir}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(event) => onChange(event.target.value)}
            className={base}
          />
        )}
      </div>
    </label>
  );
}
