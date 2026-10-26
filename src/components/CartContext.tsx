"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { quoteKey, type QuoteItem } from "@/lib/products";

export type { QuoteItem };
export type QuoteLine = QuoteItem & { qty: number };

type CartContextValue = {
  lines: QuoteLine[];
  /** adds a product with the chosen options; the same product with the same options only grows */
  addItem: (item: QuoteItem, qty?: number) => void;
  removeItem: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  /** the text to engrave on an item */
  setEngrave: (key: string, text: string) => void;
  clear: () => void;
  /** number of lines of the quote basket */
  totalCount: number;
  /** drops the lines of products that are gone from the catalogue */
  sync: () => Promise<boolean>;
  /** polite screen-reader message, e.g. "Deszka a rendelési listába került" */
  announcement: string;
  /** false during server render / hydration, so pages can avoid flashing an "empty" state */
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "sportgravir-quote-v1";
const MAX_QTY = 100000;
const EMPTY: QuoteLine[] = [];

/* ---- tiny external store: the quote basket lives in localStorage, React just subscribes to it ---- */
let cache: QuoteLine[] | null = null;
const listeners = new Set<() => void>();

const valid = (l: QuoteLine) => Number.isInteger(l?.id) && Number.isInteger(l?.qty) && l.qty > 0 && typeof l.name === "string" && typeof l.slug === "string" && typeof l.image === "string" && typeof l.options === "object";

function read(): QuoteLine[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as QuoteLine[]).filter(valid).map((l) => ({ ...l, key: quoteKey(l.id, l.options) })) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: QuoteLine[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore unavailable/blocked storage: the basket still works for this page view
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null; // another tab changed the basket
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [announcement, setAnnouncement] = useState("");
  const lines = ready ? stored : EMPTY;

  const addItem = useCallback((item: QuoteItem, qty = 1) => {
    const cur = read();
    const q = Math.max(1, Math.min(MAX_QTY, Math.floor(qty) || 1));
    const existing = cur.find((l) => l.key === item.key);
    write(existing ? cur.map((l) => (l.key === item.key ? { ...l, qty: Math.min(MAX_QTY, l.qty + q) } : l)) : [...cur, { ...item, qty: q }]);
    window.dispatchEvent(new Event("sportgravir:cart-add")); // lets the header slide back into view
    // toggle a trailing zero-width space so repeated adds are re-announced
    setAnnouncement((a) => `${item.name} a rendelési listába került${a.endsWith("​") ? "" : "​"}`);
  }, []);

  const removeItem = useCallback((key: string) => write(read().filter((l) => l.key !== key)), []);

  const setQty = useCallback((key: string, qty: number) => {
    const cur = read();
    if (qty <= 0) {
      write(cur.filter((l) => l.key !== key));
      return;
    }
    write(cur.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)));
  }, []);

  const setEngrave = useCallback((key: string, text: string) => write(read().map((l) => (l.key === key ? { ...l, engrave: text.slice(0, 300) } : l))), []);

  const clear = useCallback(() => write([]), []);

  const sync = useCallback(async () => {
    const cur = read();
    if (!cur.length) return true;
    try {
      const res = await fetch(`/api/catalog?ids=${[...new Set(cur.map((l) => l.id))].join(",")}`, { cache: "no-store" });
      if (!res.ok) return false;
      const data = (await res.json()) as { items: { id: number; slug: string; name: string; image: string; imageW: number; imageH: number }[] };
      const by = new Map(data.items.map((i) => [i.id, i]));
      const next = read()
        .map((l): QuoteLine | null => {
          const f = by.get(l.id);
          return f ? { ...l, name: f.name, slug: f.slug, image: f.image, imageW: f.imageW, imageH: f.imageH } : null;
        })
        .filter((l): l is QuoteLine => !!l);
      if (JSON.stringify(next) !== JSON.stringify(read())) write(next);
      return true;
    } catch {
      return false;
    }
  }, []);

  const totalCount = useMemo(() => lines.length, [lines]);
  const value = useMemo(() => ({ lines, addItem, removeItem, setQty, setEngrave, clear, totalCount, sync, announcement, ready }), [lines, addItem, removeItem, setQty, setEngrave, clear, totalCount, sync, announcement, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
