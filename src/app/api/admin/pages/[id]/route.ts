import { revalidatePath } from "next/cache";
import { fail, guardAdmin, json } from "@/lib/auth";
import { getPageById, mutate, pageIn, resetPage, savePage } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };
const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").slice(0, max) : "");

export async function GET(req: Request, ctx: Ctx) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const p = await getPageById(Number((await ctx.params).id));
  if (!p) return fail("Az oldal nem található.", 404);
  return json(p);
}

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Hibás kérés.");
  const title = text(body.title, 200).trim();
  if (title.length < 2) return fail("Az oldal címe kötelező.");
  // the text is HTML written by the admin: scripts and event handlers are dropped
  const html = text(body.html, 400_000)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "");
  const ok = await mutate((db) => {
    if (!pageIn(db, id)) return false;
    savePage(db, id, { title, html, hidden: Boolean(body.hidden) });
    return true;
  });
  if (!ok) return fail("Az oldal nem található.", 404);
  revalidatePath("/", "layout");
  return json({ ok: true });
}

/** Back to the version of the live site. */
export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const ok = await mutate((db) => {
    if (!pageIn(db, id)) return false;
    resetPage(db, id);
    return true;
  });
  if (!ok) return fail("Az oldal nem található.", 404);
  revalidatePath("/", "layout");
  return json({ ok: true });
}
