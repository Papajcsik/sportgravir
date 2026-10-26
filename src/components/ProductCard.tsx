import Image from "next/image";
import Link from "next/link";
import AddToCart from "./AddToCart";
import { EditButton } from "./EditButton";
import type { Card } from "@/lib/products";

/** the indicative price line of the live page ("br. 275 Ft/m"), if it has one */
export const priceNote = (note: string[]) => note.find((l) => /\d\s*(?:\.\s*-\s*)?Ft/i.test(l) && l.length < 60);

/** A product in the catalogue: photo, name, the indicative price (when the live page gives one), the options in brief and the quote button. */
export default function ProductCard({ product: p, priority = false }: { product: Card; priority?: boolean }) {
  const href = `/termek/${p.slug}`;
  const price = priceNote(p.note);
  const opt = p.options[0];
  return (
    <article className="group relative flex h-full flex-col">
      <EditButton id={p.id} className="absolute right-2 top-2 z-10" />
      <Link href={href} className="cover relative block aspect-square shrink-0 overflow-hidden bg-white transition-shadow duration-200 group-hover:shadow-lift" tabIndex={-1} aria-hidden="true">
        <Image src={p.image} alt="" width={p.imageW} height={p.imageH} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} sizes="(min-width: 1280px) 290px, (min-width: 640px) 33vw, 50vw" className="absolute inset-0 h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col pt-3.5">
        <h3 className="display line-clamp-2 min-h-[2.5em] text-[20px] leading-[1.2]">
          <Link href={href} className="hover:text-berry">
            {p.name}
          </Link>
        </h3>
        {price && <p className="mt-1 text-[15px] font-bold text-gold-dark">{price}</p>}
        {opt && (
          <p className="mt-1 line-clamp-1 text-[14px] text-ink-2">
            {opt.name}: {opt.values.slice(0, 5).join(", ")}
            {opt.values.length > 5 ? "…" : ""}
          </p>
        )}
        <div className="mt-auto pt-3.5">
          {p.options.length > 0 ? (
            <Link href={href} className="btn-outline !px-3.5 !py-2 !text-[15px]">
              Opciók választása
            </Link>
          ) : (
            <AddToCart product={p} className="!px-3.5 !py-2 !text-[15px]" />
          )}
        </div>
      </div>
    </article>
  );
}
