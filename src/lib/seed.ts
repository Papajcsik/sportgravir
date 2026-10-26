import raw from "./products.json";
import type { Option, Product } from "./products";

type Raw = {
  id: number;
  slug: string;
  name: string;
  sku: string;
  cat: string;
  cats: string[];
  note: string[];
  options: Option[];
  img: string;
  iw: number;
  ih: number;
  position: number;
};

export const PLACEHOLDER = "/images/placeholder.svg";

let cache: Product[] | null = null;

/** The catalogue as scraped from the live shop (all products). The data store only keeps what the admin changed on top of it. */
export function seedProducts(): Product[] {
  if (cache) return cache;
  cache = (raw as unknown as Raw[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    sku: r.sku,
    cat: r.cat,
    cats: r.cats,
    note: r.note,
    options: r.options,
    image: r.img || PLACEHOLDER,
    imageW: r.iw || 900,
    imageH: r.ih || 675,
    visible: true,
    position: r.position,
  }));
  return cache;
}

export const seedMaxId = () => (raw as unknown as Raw[]).reduce((m, r) => Math.max(m, r.id), 0);
