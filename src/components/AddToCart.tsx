"use client";

import { useCart } from "./CartContext";
import { quoteItemOf, type Card } from "@/lib/products";

type Props = { product: Card; className?: string };

/** "Rendelési listához adom" for a product without options (products with options get their choices on the product page). */
export default function AddToCart({ product, className = "" }: Props) {
  const { addItem, lines } = useCart();
  const item = quoteItemOf(product, {});
  const inList = lines.some((l) => l.key === item.key);
  return (
    <button type="button" onClick={() => addItem(item, 1)} className={`btn-red !gap-2 ${className}`} aria-label={`${inList ? "Még egyet hozzáadok" : "Rendelési listához adom"} – ${product.name}`}>
      <span>{inList ? "Hozzáadva +1" : "Rendelési listához adom"}</span>
    </button>
  );
}
