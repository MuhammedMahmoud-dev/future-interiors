"use client";

import { useRef, useState, useTransition } from "react";
import { deleteMedia, setCover, updateMedia, uploadMedia } from "@/app/admin/projects/actions";

type Stage = { id: string; name_ar: string };

export type MediaItem = {
  id: string;
  url: string;
  signedUrl: string | null;
  caption_ar: string | null;
  stage_id: string | null;
  phase: "before" | "during" | "after" | null;
  is_public: boolean;
};

const PHASES = [
  { value: "", label: "—" },
  { value: "before", label: "قبل" },
  { value: "during", label: "أثناء" },
  { value: "after", label: "بعد" },
];

/**
 * Upload, classify and approve photos.
 *
 * Nothing is publishable on upload: is_public starts false and has to be ticked
 * per photo, so a client's interior never reaches the public gallery by default.
 */
export function MediaManager({
  projectId,
  items,
  stages,
  coverPath,
}: {
  projectId: string;
  items: MediaItem[];
  stages: Stage[];
  coverPath: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const onUpload = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await uploadMedia(projectId, formData);
        formRef.current?.reset();
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "الرفع فشل");
      }
    });
  };

  const patch = (id: string, changes: Parameters<typeof updateMedia>[2]) => {
    startTransition(async () => {
      try {
        await updateMedia(id, projectId, changes);
      } catch {
        setError("التعديل فشل");
      }
    });
  };

  return (
    <div>
      <form ref={formRef} action={onUpload} className="border border-border bg-white p-6">
        <label className="block text-sm">
          <span className="text-muted">ارفع صور</span>
          <input
            type="file"
            name="files"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="mt-3 block w-full text-sm file:me-4 file:rounded-card file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:text-white"
          />
        </label>
        <p className="mt-2 text-xs text-muted">
          JPG أو PNG أو WebP، الحد 15 ميجا للصورة. الصور بتترفع مخفية لحد ما توافق على نشرها.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded-card border border-border px-6 py-2.5 text-sm transition-colors hover:border-ink disabled:opacity-50"
        >
          {busy ? "بيرفع…" : "رفع"}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      {items.length === 0 ? (
        <p className="mt-8 border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
          لسه مفيش صور للمشروع ده.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="border border-border bg-white">
              <div className="relative aspect-[4/3] bg-ink/5">
                {item.signedUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL
                  <img
                    src={item.signedUrl}
                    alt={item.caption_ar ?? ""}
                    className="h-full w-full object-cover"
                  />
                )}
                {coverPath === item.url && (
                  <span className="absolute top-2 start-2 bg-accent px-2 py-1 text-[10px] text-ink">
                    الغلاف
                  </span>
                )}
              </div>

              <div className="space-y-3 p-4 text-sm">
                <input
                  type="text"
                  defaultValue={item.caption_ar ?? ""}
                  placeholder="وصف الصورة"
                  onBlur={(event) => patch(item.id, { caption_ar: event.target.value })}
                  className="w-full border-b border-border bg-transparent py-1 text-xs placeholder:text-muted focus:border-accent focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    defaultValue={item.stage_id ?? ""}
                    onChange={(event) => patch(item.id, { stage_id: event.target.value || null })}
                    className="rounded-card border border-border px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
                  >
                    <option value="">المرحلة —</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name_ar}
                      </option>
                    ))}
                  </select>

                  <select
                    defaultValue={item.phase ?? ""}
                    onChange={(event) => patch(item.id, { phase: event.target.value || null })}
                    className="rounded-card border border-border px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
                  >
                    {PHASES.map((phase) => (
                      <option key={phase.value} value={phase.value}>
                        {phase.value ? phase.label : "المرحلة الزمنية —"}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    defaultChecked={item.is_public}
                    onChange={(event) => patch(item.id, { is_public: event.target.checked })}
                    className="h-4 w-4 accent-[#c6a664]"
                  />
                  اعرضها على الموقع العام
                </label>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await setCover(projectId, item.url);
                      })
                    }
                    className="text-muted transition-colors hover:text-ink"
                  >
                    اجعلها الغلاف
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteMedia(item.id, projectId, item.url);
                      })
                    }
                    className="text-muted transition-colors hover:text-red-600"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
