"use client";

import { useRef, useState, useTransition } from "react";

import {
  deleteGalleryImage,
  moveGalleryImage,
  updateGalleryImage,
  uploadGalleryImages,
} from "@/app/admin/gallery/actions";

export type GalleryItem = {
  id: string;
  url: string;
  signedUrl: string | null;
  caption_ar: string | null;
  is_public: boolean;
};

/**
 * The works gallery.
 *
 * Deliberately its own screen rather than a tab inside a project. These
 * photographs belong to the site, not to any one job — which is exactly why
 * deleting a project can no longer take them with it — and putting them back
 * under a project in the interface would teach the opposite.
 *
 * Position matters here in a way it does not for project photos: the first
 * three lead the homepage. The order is shown and moved explicitly rather than
 * dragged, because up and down are unambiguous and drag-and-drop on a touch
 * screen mostly is not.
 */
export function GalleryManager({ items }: { items: GalleryItem[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const run = (work: () => Promise<unknown>, message: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await work();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : message);
      }
    });
  };

  const onUpload = (formData: FormData) => {
    run(async () => {
      await uploadGalleryImages(formData);
      formRef.current?.reset();
    }, "الرفع فشل");
  };

  return (
    <div>
      <form ref={formRef} action={onUpload} className="border border-border bg-white p-6">
        <label className="block text-sm">
          <span className="text-muted-ink">ارفع صور للمعرض</span>
          <input
            type="file"
            name="files"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="mt-3 block w-full text-sm file:me-4 file:rounded-card file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:text-white"
          />
        </label>
        <p className="mt-2 text-xs text-muted-ink">
          JPG أو PNG أو WebP، الحد 15 ميجا للصورة. الصور دي بتظهر في صفحة الأعمال
          على طول — أول تلات صور منها بتظهر كمان في الصفحة الرئيسية.
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
        <p className="mt-8 border border-dashed border-border px-6 py-16 text-center text-sm text-muted-ink">
          لسه مفيش صور في المعرض.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div key={item.id} className="border border-border bg-white">
              <div className="relative aspect-[4/3] bg-ink/5">
                {item.signedUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL
                  <img
                    src={item.signedUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {index < 3 && (
                  <span className="absolute start-2 top-2 rounded-pill bg-ink px-2 py-0.5 text-[10px] text-white">
                    في الرئيسية
                  </span>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-ink">
                  <span>الترتيب {index + 1}</span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() => run(() => moveGalleryImage(item.id, "up"), "النقل فشل")}
                      aria-label="حرّك الصورة لفوق"
                      className="rounded-card border border-border px-2 py-1 transition-colors hover:border-ink disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === items.length - 1}
                      onClick={() => run(() => moveGalleryImage(item.id, "down"), "النقل فشل")}
                      aria-label="حرّك الصورة لتحت"
                      className="rounded-card border border-border px-2 py-1 transition-colors hover:border-ink disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </span>
                </div>

                <input
                  defaultValue={item.caption_ar ?? ""}
                  onBlur={(event) =>
                    run(
                      () => updateGalleryImage(item.id, { caption_ar: event.target.value }),
                      "التعديل فشل",
                    )
                  }
                  placeholder="وصف الصورة (اختياري)"
                  className="w-full border-b border-border bg-transparent py-1 text-xs placeholder:text-muted-ink focus:border-accent"
                />

                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      defaultChecked={item.is_public}
                      onChange={(event) =>
                        run(
                          () => updateGalleryImage(item.id, { is_public: event.target.checked }),
                          "التعديل فشل",
                        )
                      }
                      className="h-4 w-4 accent-[#c6a664]"
                    />
                    ظاهرة في المعرض
                  </label>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() => deleteGalleryImage(item.id, item.url), "الحذف فشل")
                    }
                    className="text-xs text-red-700 underline underline-offset-4 hover:text-red-900 disabled:opacity-40"
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
