"use client";

import { useEffect, useRef, useState } from "react";

export type GalleryImage = { id: string; url: string; caption: string };

/** Gallery grid backed by a native <dialog> — no modal library, Esc closes for free. */
export function Lightbox({ images, closeLabel }: { images: GalleryImage[]; closeLabel: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  const open = (position: number) => {
    setIndex(position);
    dialogRef.current?.showModal();
  };

  const step = (delta: number) => {
    setIndex((current) => (current + delta + images.length) % images.length);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!dialogRef.current?.open) return;
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  if (images.length === 0) return null;
  const current = images[index];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((image, position) => (
          <button
            key={image.id}
            type="button"
            onClick={() => open(position)}
            className="group aspect-[4/3] overflow-hidden bg-ink/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- signed URLs */}
            <img
              src={image.url}
              alt={image.caption}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="max-h-[92vh] w-[92vw] max-w-5xl bg-transparent backdrop:bg-ink/90"
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.caption}
            className="max-h-[80vh] w-full object-contain"
          />

          {current.caption && (
            <p className="mt-4 text-center text-sm text-white/70">{current.caption}</p>
          )}

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={closeLabel}
            className="absolute -top-10 end-0 text-2xl text-white"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="‹"
                className="absolute inset-y-0 start-0 px-4 text-4xl text-white/70 hover:text-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="›"
                className="absolute inset-y-0 end-0 px-4 text-4xl text-white/70 hover:text-white"
              >
                ›
              </button>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
