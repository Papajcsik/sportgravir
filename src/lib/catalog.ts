import "server-only";
import { inCategory } from "./categories";
import type { Product } from "./products";

export const SORTS = ["ajanlott", "nev", "ujabb"] as const;
export type Sort = (typeof SORTS)[number];

/** What the catalogue pages read from the URL. The category itself is the path of the page. */
export type Query = {
  q: string;
  sort: Sort;
  page: number;
};

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseQuery(sp: SP, fixed: Partial<Query> = {}): Query {
  const sort = first(sp.rendez) as Sort;
  return {
    q: first(sp.q).trim().slice(0, 80),
    sort: SORTS.includes(sort) ? sort : "ajanlott",
    page: Math.max(1, Math.min(500, Number(first(sp.oldal)) || 1)),
    ...fixed,
  };
}

/** The URL query string of a query (empty values are left out). */
export function queryString(q: Partial<Query>, extra: Partial<Query> = {}) {
  const m = { ...q, ...extra };
  const p = new URLSearchParams();
  if (m.q) p.set("q", m.q);
  if (m.sort && m.sort !== "ajanlott") p.set("rendez", m.sort);
  if (m.page && m.page > 1) p.set("oldal", String(m.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Accent- and case-insensitive text for searching. */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const hay = new WeakMap<Product, string>();
const hayOf = (p: Product) => {
  let h = hay.get(p);
  if (h === undefined) {
    h = fold(`${p.name} ${p.sku} ${p.note.join(" ")} ${p.options.map((o) => o.values.join(" ")).join(" ")}`);
    hay.set(p, h);
  }
  return h;
};

export function filterProducts(all: Product[], q: Query, path?: string): Product[] {
  const words = fold(q.q).split(/\s+/).filter(Boolean);
  return all.filter((p) => {
    if (!p.visible) return false;
    if (path && !inCategory(p, path)) return false;
    if (words.length) {
      const h = hayOf(p);
      if (!words.every((w) => h.includes(w))) return false;
    }
    return true;
  });
}

export function sortProducts(list: Product[], sort: Sort): Product[] {
  const l = [...list];
  if (sort === "nev") return l.sort((a, b) => a.name.localeCompare(b.name, "hu"));
  if (sort === "ujabb") return l.sort((a, b) => b.id - a.id);
  return l.sort((a, b) => a.position - b.position);
}

export const PAGE_SIZE = 24;
