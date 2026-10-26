"use client";

import { useCart } from "./CartContext";

/** Polite live region so screen-reader users hear that an item reached the cart. */
export default function CartAnnouncer() {
  const { announcement } = useCart();
  return (
    <div className="sr-only-live" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}
