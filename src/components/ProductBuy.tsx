"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartContext";
import { quoteItemOf, type Card } from "@/lib/products";
import { site } from "@/lib/site";

/** The option choices (length, colour, size…), the quantity and the "Rendelési listához adom" button. */
export default function ProductBuy({ product: p }: { product: Card }) {
  const { addItem } = useCart();
  const [sel, setSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const missing = p.options.filter((o) => !sel[o.name]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (missing.length) return;
        addItem(quoteItemOf(p, sel), qty);
        setAdded(true);
      }}
    >
      {p.options.map((o, i) => (
        <div key={o.name}>
          <label htmlFor={`opt-${i}`} className="mb-1.5 block text-[16px] font-bold text-ink">
            {o.name} *
          </label>
          <select
            id={`opt-${i}`}
            required
            value={sel[o.name] ?? ""}
            onChange={(e) => {
              setSel({ ...sel, [o.name]: e.target.value });
              setAdded(false);
            }}
            className="field"
          >
            <option value="">Válassz egy lehetőséget</option>
            {o.values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex h-[52px] items-stretch rounded-md border border-line bg-white" role="group" aria-label="Mennyiség">
          <button type="button" className="w-11 text-xl font-bold leading-none hover:bg-paper" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Mennyiség csökkentése">
            −
          </button>
          <label htmlFor="qty" className="sr-only">
            Mennyiség
          </label>
          <input id="qty" inputMode="numeric" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(100000, Number(e.target.value.replace(/\D/g, "")) || 1)))} className="w-16 border-x border-line bg-transparent text-center text-[19px] font-bold tabular-nums text-ink" />
          <button type="button" className="w-11 text-xl font-bold leading-none hover:bg-paper" onClick={() => setQty(qty + 1)} aria-label="Mennyiség növelése">
            +
          </button>
        </div>
        <button type="submit" className="btn-red !px-8 !py-[13px] !text-[18px]">
          Rendelési listához adom
        </button>
      </div>

      {added && (
        <p role="status" className="rounded-md bg-[#e4efe8] px-4 py-3 text-[16px] leading-6 text-ink">
          A rendelési listába került.{" "}
          <Link href="/rendeles" className="font-bold text-berry underline underline-offset-2">
            Rendelés elküldése
          </Link>{" "}
          vagy válogass tovább.
        </p>
      )}
      <p className="text-[15px] leading-6 text-ink-2">
        Az árat kollégáink küldik el. Gyorsabb, ha hívsz:{" "}
        <a href={site.phoneHref} className="font-bold text-berry underline underline-offset-2">
          {site.phone}
        </a>
        .
      </p>
    </form>
  );
}
