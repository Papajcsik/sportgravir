import "server-only";
import { isCatPath } from "./categories";
import { slugify, type Option, type Product, type ProductDetails } from "./products";
import { PLACEHOLDER } from "./seed";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const bool = (v: unknown, fallback: boolean) => (v === undefined ? fallback : Boolean(v));

const IMAGE_RE = /^\/(images|uploads)\/[A-Za-z0-9._~/-]+$/;

/** "Hossz: 3m | 4m | 5m" per line (values may contain commas) */
const parseOptions = (s: string): Option[] =>
  s
    .split(/\n+/)
    .map((l) => l.split(":"))
    .filter((p) => p.length >= 2 && p[0].trim())
    .map((p) => ({ name: p[0].trim().slice(0, 40), values: p.slice(1).join(":").split("|").map((v) => v.trim()).filter(Boolean).slice(0, 60) }))
    .filter((o) => o.values.length)
    .slice(0, 8);

/** Validate and clean an edited product. Returns the cleaned product or an error message. */
export function cleanProductInput(input: unknown, base: Product): { ok: true; value: Product } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Hibás adatok." };
  const i = input as Record<string, unknown>;
  const name = str(i.name, 200);
  if (name.length < 2) return { ok: false, error: "A termék neve kötelező." };
  const cat = typeof i.cat === "string" && isCatPath(i.cat) ? i.cat : base.cat;
  const cats = Array.isArray(i.cats) ? (i.cats.filter((c) => typeof c === "string" && isCatPath(c)) as string[]) : base.cats;
  const image = typeof i.image === "string" && IMAGE_RE.test(i.image) ? i.image : base.image || PLACEHOLDER;
  const value: Product = {
    ...base,
    name,
    sku: str(i.sku, 60),
    cat,
    cats: cats.includes(cat) ? cats : [cat, ...cats],
    note: typeof i.note === "string" ? str(i.note, 800).split(/\n+/).map((s) => s.trim()).filter(Boolean) : base.note,
    options: typeof i.options === "string" ? parseOptions(str(i.options, 3000)) : base.options,
    image,
    imageW: Math.max(1, Math.min(8000, Math.round(num(i.imageW) ?? base.imageW))),
    imageH: Math.max(1, Math.min(8000, Math.round(num(i.imageH) ?? base.imageH))),
    visible: bool(i.visible, base.visible),
  };
  return { ok: true, value };
}

export function cleanDetails(input: unknown): ProductDetails {
  const i = (input ?? {}) as Record<string, unknown>;
  const desc = Array.isArray(i.desc) ? i.desc.map((d) => str(d, 4000)).filter(Boolean).slice(0, 80) : [];
  return { desc };
}

export function blankProduct(id: number, position: number): Product {
  const name = "Új termék";
  return { id, slug: `${slugify(name)}-${id}`, name, sku: "", cat: "tetokiegeszito", cats: ["tetokiegeszito"], note: [], options: [], image: PLACEHOLDER, imageW: 900, imageH: 675, visible: true, position };
}
