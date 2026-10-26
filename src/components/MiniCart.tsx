"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";

const ClipboardGlyph = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3h6v1M8.500 10h7M8.500 14h7M8.500 17.500h4" />
  </svg>
);

/**
 * Header button of the quote basket ("rendelési lista"): with items it opens a small panel with the list (options, quantity, remove)
 * and the link to the request form. The header decides when to open it (after an add, or on click) and positions it.
 */
export default function MiniCart({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const { lines, totalCount, setQty, removeItem } = useCart();
  const visible = open && totalCount > 0;

  return (
    <>
      {totalCount === 0 && (
        <Link href="/rendeles" className="flex items-center gap-2 px-3 py-3 text-[15.5px] font-bold text-ink hover:text-berry" aria-label="Rendelési lista (üres)">
          <ClipboardGlyph size={24} />
          <span className="whitespace-nowrap max-xl:hidden">Rendelési lista</span>
        </Link>
      )}
      {totalCount > 0 && (
        <button type="button" onClick={onToggle} aria-expanded={visible} aria-controls="mini-cart" aria-haspopup="dialog" className="cart-pop flex items-center gap-2 px-3 py-3 text-[15.5px] font-bold leading-none text-ink hover:text-berry" aria-label={`Rendelési lista: ${totalCount} tétel`}>
          <span className="relative inline-flex" aria-hidden="true">
            <ClipboardGlyph size={24} />
            <span key={totalCount} className="badge-bump absolute -right-3 -top-2.5 flex min-w-5 items-center justify-center rounded-full bg-berry px-1 py-0.5 text-[12px] font-bold leading-none text-white">
              {totalCount}
            </span>
          </span>
          <span aria-hidden="true" className="max-xl:hidden">
            Rendelési lista
          </span>
        </button>
      )}

      <div
        id="mini-cart"
        role="dialog"
        aria-label="A rendelési lista tartalma"
        inert={!visible}
        className={`absolute right-3 top-full z-10 mt-2 flex max-h-[calc(100dvh-72px-16px)] w-[min(400px,calc(100vw-24px))] origin-top-right flex-col rounded-md border border-line bg-cream text-ink-2 shadow-card transition-[opacity,translate,scale,visibility] duration-200 ease-out lg:right-5 ${
          visible ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
          <h2 className="display text-[22px] leading-none">Rendelési lista ({totalCount})</h2>
          <button type="button" onClick={onClose} className="-mr-2 flex size-10 items-center justify-center hover:bg-paper" aria-label="Rendelési lista bezárása">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <ul className="scroll-shadow min-h-0 max-h-[min(40dvh,380px)] flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-5" tabIndex={0} aria-label="A rendelési lista tételei – görgethető">
          {lines.map((l) => (
            <li key={l.key} className="grid grid-cols-[56px_1fr] items-start gap-x-3 py-3">
              <span className="relative block h-[56px] rounded-sm border border-line bg-white">
                <Image src={l.image} alt="" fill sizes="56px" loading="eager" className="object-cover" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-snug text-ink">
                  <Link href={`/termek/${l.slug}`} className="hover:underline" onClick={onClose}>
                    {l.name}
                  </Link>
                </p>
                {Object.keys(l.options).length > 0 && <p className="text-[13.5px] leading-5 text-ink-2">{Object.entries(l.options).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>}
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="flex h-9 items-stretch rounded-md border border-line bg-white" role="group" aria-label={`Mennyiség: ${l.name}`}>
                    <button type="button" className="w-9 text-lg font-bold leading-none hover:bg-paper" onClick={() => setQty(l.key, l.qty - 1)} aria-label={`${l.name} mennyiségének csökkentése`}>
                      −
                    </button>
                    <span className="flex w-10 items-center justify-center border-x border-line text-[15px] font-bold tabular-nums">{l.qty}</span>
                    <button type="button" className="w-9 text-lg font-bold leading-none hover:bg-paper" onClick={() => setQty(l.key, l.qty + 1)} aria-label={`${l.name} mennyiségének növelése`}>
                      +
                    </button>
                  </div>
                  <button type="button" className="-m-2 p-2 text-[14px] underline underline-offset-2 hover:text-berry" onClick={() => removeItem(l.key)}>
                    Törlés<span className="sr-only">: {l.name}</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="shrink-0 border-t border-line px-5 pb-5 pt-4">
          <p className="text-[14.5px] leading-5">A gravírozásról látványtervet küldünk, a gyártás csak az elfogadás után indul. Az árakat az árlistában találod.</p>
          <Link href="/rendeles" onClick={onClose} className="btn-red mt-4 w-full !py-2.5">
            Rendelés elküldése
          </Link>
        </div>
      </div>
    </>
  );
}
