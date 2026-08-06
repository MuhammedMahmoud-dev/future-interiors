"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export type GalleryImage = { id: string; url: string; caption: string };

/**
 * Gallery grid backed by a native <dialog> — no modal library, Esc closes for free.
 *
 * This is the whole portfolio now: the works page and the homepage row are both
 * this component. Projects are shown as photographs with no title, area, year or
 * location, so `caption` is usually empty; `alt` is passed separately and always
 * carries something, because an empty alt on a content image is not a caption
 * decision, it is a missing one.
 */
export function Lightbox({
  images,
  closeLabel,
  alt,
  columns = 3,
}: {
  images: GalleryImage[];
  closeLabel: string;
  /** Non-identifying description for every tile, e.g. "من أعمالنا". */
  alt: string;
  columns?: 2 | 3;
}) {
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
      <div
        className={`grid gap-4 ${
          columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3"
        }`}
      >
        {images.map((image, position) => (
          <button
            key={image.id}
            type="button"
            onClick={() => open(position)}
            className="group relative aspect-[4/3] overflow-hidden rounded-card border border-border bg-ink/5"
          >
            {/*
              Through the optimiser rather than served raw: the gallery was
              shipping about a megabyte of full-size photographs per visit, none
              of them resized for the box they render in.

              `sizes` is what makes it work — without it Next assumes 100vw and
              serves a desktop-width file to a phone anyway.
            */}
            <Image
              src={image.url}
              alt={image.caption || alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 620px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
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
            alt={current.caption || alt}
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
