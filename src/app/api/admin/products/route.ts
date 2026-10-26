import { revalidatePath } from "next/cache";
import { fail, guardAdmin, json } from "@/lib/auth";
import { filterProducts, parseQuery, sortProducts } from "@/lib/catalog";
import { addProduct, getAllProducts, mutate } from "@/lib/store";
import { blankProduct, cleanDetails, cleanProductInput } from "@/lib/productInput";
import { isCatPath } from "@/lib/categories";
import { slugify } from "@/lib/products";

const PER = 40;

/** One page of the catalogue for the admin table (1,600 rows are never sent at once). */
export async function GET(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const u = new URL(req.url);
  const sp = Object.fromEntries(u.searchParams);
  const q = parseQuery(sp);
  const path = sp.kat && isCatPath(sp.kat) ? sp.kat : undefined;
  const all = await getAllProducts();
  const hidden = sp.rejtett === "1";
  const edited = sp.modositott === "1";
  // the text and category filters apply to the hidden ones too
  const ids = new Set(filterProducts(all.map((p) => ({ ...p, visible: true })), q, path).map((p) => p.id));
  let list = all.filter((p) => ids.has(p.id) && (hidden ? !p.visible : p.visible));
  if (edited) list = list.filter((p) => p.custom);
  list = sortProducts(list, q.sort === "ajanlott" ? "nev" : q.sort);
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PER));
  const page = Math.min(q.page, pages);
  const items = list.slice((page - 1) * PER, page * PER);
  return json({ items, total, page, pages, per: PER });
}

export async function POST(req: Request) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const result = await mutate((db) => {
    const id = db.counters.product + 1;
    const position = 1_000_000 + db.created.length;
    const cleaned = cleanProductInput(body, blankProduct(id, position));
    if (!cleaned.ok) return cleaned;
    const product = { ...cleaned.value, id, position, slug: `${slugify(cleaned.value.name) || "darab"}-${id}`, custom: true };
    db.counters.product = id;
    addProduct(db, product);
    (db.details ??= {})[String(id)] = cleanDetails(body);
    return { ok: true as const, value: product };
  });
  if (!result.ok) return fail(result.error);
  revalidatePath("/", "layout");
  return json(result.value, { status: 201 });
}
