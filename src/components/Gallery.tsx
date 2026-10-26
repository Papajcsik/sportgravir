"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Img = { src: string; alt: string; w: number; h: number };

/** A photo wall with a lightbox: click a photo to see it large, arrow keys and Escape work. Used for the engraving samples and the references. */
export default function Gallery({ images, label }: { images: Img[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    lastFocus.current?.focus();
  }, []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (open === null) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-label={label}>
        {images.map((im, i) => (
          <li key={im.src}>
            <button
              type="button"
              onClick={(e) => {
                lastFocus.current = e.currentTarget;
                setOpen(i);
              }}
              className="group block w-full overflow-hidden rounded-md border border-line bg-white shadow-card transition-shadow hover:shadow-lift"
              aria-label={`${i + 1}. fotó nagyítása: ${im.alt || label}`}
            >
              <Image src={im.src} alt={im.alt} width={im.w} height={im.h} sizes="(min-width: 1024px) 290px, (min-width: 640px) 31vw, 46vw" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${label}: ${open + 1} / ${images.length}`} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-3 outline-none sm:p-8" onClick={close}>
          <div className="relative flex max-h-full max-w-full flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <Image key={images[open].src} src={images[open].src} alt={images[open].alt} width={images[open].w} height={images[open].h} sizes="92vw" className="max-h-[82dvh] w-auto max-w-full rounded-md border-2 border-gold bg-white object-contain" priority />
            <p className="mt-3 text-[15px] text-mist" aria-live="polite">
              {open + 1} / {images.length}
              {images[open].alt ? ` · ${images[open].alt}` : ""}
            </p>
          </div>
          <button type="button" onClick={close} className="absolute right-3 top-3 flex size-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20" aria-label="Bezárás">
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={(e) => (e.stopPropagation(), step(-1))} className="absolute left-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20" aria-label="Előző fotó">
                ‹
              </button>
              <button type="button" onClick={(e) => (e.stopPropagation(), step(1))} className="absolute right-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20" aria-label="Következő fotó">
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
