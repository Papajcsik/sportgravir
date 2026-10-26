"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = { src: string; w: number; h: number };

/** The cover on its tile; the extra photos (the box, the pieces, the table) are a row of thumbnails below. */
export default function ProductGallery({ name, images }: { name: string; images: GalleryImage[] }) {
  const [i, setI] = useState(0);
  const cur = images[i] ?? images[0];
  return (
    <div className="mx-auto w-full max-w-[600px] lg:mx-0">
      <div className="cover relative aspect-[4/3] overflow-hidden !shadow-card">
        <Image
          key={cur.src}
          src={cur.src}
          alt={i === 0 ? name : `${name} – ${i + 1}. fotó`}
          fill
          loading="eager"
          fetchPriority={i === 0 ? "high" : "auto"}
          sizes="(min-width: 1024px) 560px, 92vw"
          className="object-contain p-2"
        />
      </div>
      {images.length > 1 && (
        <ul className="mt-6 flex flex-wrap gap-2.5" aria-label="További fotók">
          {images.map((im, n) => (
            <li key={im.src}>
              <button
                type="button"
                onClick={() => setI(n)}
                aria-label={`${n + 1}. fotó megnyitása`}
                aria-pressed={n === i}
                className={`relative block size-[72px] overflow-hidden rounded-lg border-2 bg-white ${n === i ? "border-ink" : "border-line hover:border-ink/60"}`}
              >
                <Image src={im.src} alt="" fill sizes="72px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
