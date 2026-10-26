import { revalidatePath } from "next/cache";
import { fail, guardAdmin, json } from "@/lib/auth";
import { cleanDetails, cleanProductInput } from "@/lib/productInput";
import { getDetails, mutate, productIn, removeProduct, saveProduct, readDb } from "@/lib/store";
import { getProductById } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

/** A product with its long texts, as the editor works on it. */
export async function GET(req: Request, ctx: Ctx) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const p = await getProductById(id);
  if (!p) return fail("A termék nem található.", 404);
  const d = await getDetails(id);
  await readDb();
  return json({ ...p, desc: d.desc ?? [] });
}

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const seedDetails = await getDetails(id);
  const result = await mutate((db) => {
    const base = productIn(db, id);
    if (!base) return { ok: false as const, error: "A termék nem található.", status: 404 };
    const cleaned = cleanProductInput(body, base);
    if (!cleaned.ok) return { ...cleaned, status: 400 };
    const product = { ...cleaned.value, id, slug: base.slug, position: base.position, custom: true };
    saveProduct(db, product);
    if (body && "desc" in body) (db.details ??= {})[String(id)] = { ...(db.details?.[String(id)] ?? seedDetails), ...cleanDetails(body) };
    return { ok: true as const, value: product };
  });
  if (!result.ok) return fail(result.error, result.status);
  revalidatePath("/", "layout");
  return json(result.value);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const removed = await mutate((db) => {
    if (!productIn(db, id)) return false;
    removeProduct(db, id);
    return true;
  });
  if (!removed) return fail("A termék nem található.", 404);
  revalidatePath("/", "layout");
  return json({ ok: true });
}
