"use client";

import { useEffect, useRef, useState } from "react";

export type TestimonialItem = {
  id: string;
  quote: string;
  /** Already resolved against each client's consent flag on the server. */
  attribution: string;
};

export function TestimonialsSlider({ items }: { items: TestimonialItem[] }) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      if (!paused.current) setIndex((current) => (current + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      <div className="relative min-h-56">
        {items.map((item, itemIndex) => (
          <blockquote
            key={item.id}
            aria-hidden={itemIndex !== index}
            className={`transition-opacity duration-700 ${
              itemIndex === index ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
            }`}
          >
            <p className="font-serif text-xl leading-9 text-white/90 sm:text-2xl sm:leading-10">{item.quote}</p>
            <footer className="mt-6 text-sm tracking-wide text-gold">{item.attribution}</footer>
          </blockquote>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-8 flex gap-2">
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={`${itemIndex + 1}`}
              aria-current={itemIndex === index}
              className={`h-px w-10 transition-colors ${
                itemIndex === index ? "bg-gold" : "bg-white/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
