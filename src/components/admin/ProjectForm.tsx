"use client";

import { useActionState } from "react";
import type { ProjectFormState } from "@/app/admin/projects/actions";
import type { AdminProject } from "@/lib/adminData";
import { ClientPicker, type PickerClient } from "./ClientPicker";

const initial: ProjectFormState = { error: null };

/**
 * Create/edit form. The private block (unit, building, client, supervision rate)
 * exists only here — none of it is selectable by the public site.
 */
export function ProjectForm({
  action,
  project,
  submitLabel,
  clients,
}: {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  project?: AdminProject;
  submitLabel: string;
  /** Active clients, for linking this project to one of them. */
  clients: PickerClient[];
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-10">
      <Section title="بيانات عامة" note="دي البيانات اللي بتظهر على الموقع">
        <Field label="العنوان المعروض (عربي)" required>
          <input
            name="title_ar"
            required
            defaultValue={project?.title_ar ?? ""}
            placeholder="شقة 200م - كمبوند كالما"
            className={input}
          />
        </Field>

        <Field label="العنوان المعروض (إنجليزي)">
          <input name="title_en" defaultValue={project?.title_en ?? ""} dir="ltr" className={input} />
        </Field>

        <Field label="الـ slug (في اللينك)" required>
          <input
            name="slug"
            required
            dir="ltr"
            defaultValue={project?.slug ?? ""}
            placeholder="kalma-200"
            pattern="[a-z0-9\-]+"
            className={input}
          />
        </Field>

        <Field label="الكمبوند">
          <input name="compound" defaultValue={project?.compound ?? ""} className={input} />
        </Field>

        <Field label="المنطقة">
          <input name="district" defaultValue={project?.district ?? ""} className={input} />
        </Field>

        <Field label="المساحة (م²)">
          <input
            name="area_m2"
            inputMode="decimal"
            dir="ltr"
            defaultValue={project?.area_m2 ? String(project.area_m2) : ""}
            className={input}
          />
        </Field>

        <Field label="تاريخ البداية">
          <input type="date" name="start_date" defaultValue={project?.start_date ?? ""} className={input} />
        </Field>

        <Field label="تاريخ الانتهاء">
          <input type="date" name="end_date" defaultValue={project?.end_date ?? ""} className={input} />
        </Field>

        <Field label="الحالة">
          <select name="status" defaultValue={project?.status ?? "in_progress"} className={input}>
            <option value="in_progress">جاري التنفيذ</option>
            <option value="completed">مكتمل</option>
            <option value="on_hold">متوقف مؤقتاً</option>
          </select>
        </Field>

        <Field label="الوصف (عربي)" wide>
          <textarea
            name="description_ar"
            rows={4}
            defaultValue={project?.description_ar ?? ""}
            className={input}
          />
        </Field>

        <Field label="الوصف (إنجليزي)" wide>
          <textarea
            name="description_en"
            rows={4}
            dir="ltr"
            defaultValue={project?.description_en ?? ""}
            className={input}
          />
        </Field>
      </Section>

      <Section
        title="بيانات خاصة"
        note="دي مابتظهرش على الموقع العام أبداً — بس في اللوحة دي وفي صفحة العميل"
        private
      >
        <Field label="رقم الوحدة">
          <input name="unit_no" defaultValue={project?.unit_no ?? ""} className={input} />
        </Field>

        <Field label="رقم العمارة">
          <input name="building_no" defaultValue={project?.building_no ?? ""} className={input} />
        </Field>

        {/* The client is a record of its own now, so one person can hold several
            projects. The phone here is what they sign in to the portal with. */}
        <ClientPicker
          clients={clients}
          currentClientId={project?.client_id}
          currentClientLabel={project?.clients?.name ?? null}
        />

        <Field label="نسبة الإشراف" note="بين 0 و 1 — مثال 0.15 يعني 15%" required>
          <input
            name="supervision_rate"
            required
            inputMode="decimal"
            dir="ltr"
            defaultValue={project ? String(project.supervision_rate) : "0.15"}
            className={input}
          />
        </Field>
      </Section>

      <Section title="النشر" note="المشروع مايظهرش في المعرض غير لما الاتنين يتفعلوا">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={project?.is_public ?? false}
            className="h-4 w-4 accent-[#c9a227]"
          />
          اعرض المشروع في المعرض
        </label>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="publish_approved_at"
            defaultChecked={Boolean(project?.publish_approved_at)}
            className="h-4 w-4 accent-[#c9a227]"
          />
          العميل وافق على النشر
        </label>
      </Section>

      {state.error && (
        <p role="alert" className="border-s-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-pill bg-gold px-8 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "بيحفظ…" : submitLabel}
        </button>
        {state.savedAt && !state.error && <span className="text-sm text-green-700">اتحفظ</span>}
      </div>
    </form>
  );
}

const input =
  "w-full rounded-card border border-ink/15 bg-white px-3 py-2.5 text-sm focus:border-gold-ink focus:outline-none";

function Section({
  title,
  note,
  children,
  private: isPrivate,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  private?: boolean;
}) {
  return (
    <section
      className={`border p-6 ${isPrivate ? "border-gold/50 bg-gold/[0.04]" : "border-ink/10 bg-white"}`}
    >
      <h2 className="text-sm tracking-widest text-ink/60">{title}</h2>
      {note && <p className="mt-1 text-xs text-ink/40">{note}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  note,
  required,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  note?: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs text-ink/50">
        {label}
        {required && <span className="text-gold-ink"> *</span>}
      </span>
      <div className="mt-2">{children}</div>
      {note && <span className="mt-1 block text-xs text-ink/35">{note}</span>}
    </label>
  );
}
