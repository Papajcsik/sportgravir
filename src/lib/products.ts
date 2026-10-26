/**
 * Shared (client + server safe) catalogue, quote-basket and inquiry types.
 * Sport Gravír sells by quote: the shop publishes no prices (the live WooCommerce prices are placeholders), the visitor collects products with their
 * options (length, colour, size…) and quantities in the "rendelési lista" and sends it; the staff answers with a price.
 */

export type Img = { src: string; w: number; h: number };

/** one choice of a product: "Hossz": ["3m", "4m", "5m"] */
export type Option = { name: string; values: string[] };

export type Product = {
  id: number;
  slug: string;
  name: string;
  /** cikkszám (rarely filled in on the live shop) */
  sku: string;
  /** primary category path ("ereszcsatorna-rendszerek/ereszcsatorna-25-os-keresztmetszet") and every category the live shop lists it in */
  cat: string;
  cats: string[];
  /** the short lines under the title of the live page ("br. 275 Ft/m", "Elérhető hosszúság: 3m, 4m…") */
  note: string[];
  options: Option[];
  image: string;
  imageW: number;
  imageH: number;
  visible: boolean;
  position: number;
  /** created or edited in the admin */
  custom?: boolean;
};

/** Long text, more photos and related products (kept out of the lists to keep them light). */
export type ProductDetails = {
  images?: Img[];
  /** "## heading", "- list item" or a paragraph */
  desc?: string[];
  rel?: string[];
};

/** What the lists and the quote basket need. */
export type Card = Pick<Product, "id" | "slug" | "name" | "cat" | "note" | "options" | "image" | "imageW" | "imageH">;
export const toCard = (p: Product): Card => ({ id: p.id, slug: p.slug, name: p.name, cat: p.cat, note: p.note, options: p.options, image: p.image, imageW: p.imageW, imageH: p.imageH });

/** A line of the quote basket: the product, the chosen options and the quantity (free text unit is part of the note). */
export type QuoteItem = { key: string; /** the text to engrave, typed in the order list */ engrave?: string; id: number; slug: string; name: string; options: Record<string, string>; image: string; imageW: number; imageH: number };
export const quoteKey = (id: number, options: Record<string, string>) => `${id}|${Object.keys(options).sort().map((k) => `${k}=${options[k]}`).join(";")}`;
export const quoteItemOf = (p: Card, options: Record<string, string>): QuoteItem => ({ key: quoteKey(p.id, options), id: p.id, slug: p.slug, name: p.name, options, image: p.image, imageW: p.imageW, imageH: p.imageH });

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const groupHu = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/* ---------------- settings ---------------- */

export type Settings = {
  /** announcement bar above the shop (e.g. closed days); empty = none */
  notice: string;
};

export const defaultSettings: Settings = {
  notice: "",
};

/* ---------------- inquiries ---------------- */

export const inquiryTypes = ["ajanlat", "kapcsolat"] as const;
export type InquiryType = (typeof inquiryTypes)[number];
export const inquiryLabel: Record<InquiryType, string> = {
  ajanlat: "Rendelés",
  kapcsolat: "Üzenet",
};

export type Inquiry = {
  id: string;
  number: string;
  createdAt: string;
  type: InquiryType;
  status: "new" | "done";
  name: string;
  email: string;
  phone: string;
  /** one-line summary for the list */
  subject: string;
  details: string[];
  adminNote: string;
};
