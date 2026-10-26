import { fail, guardAdmin, json } from "@/lib/auth";
import { mutate } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { status?: unknown; adminNote?: unknown } | null;
  if (!body) return fail("Hibás kérés.");
  const result = await mutate((db) => {
    const q = db.inquiries.find((x) => x.id === id);
    if (!q) return null;
    if (typeof body.adminNote === "string") q.adminNote = body.adminNote.trim().slice(0, 1000);
    if (body.status === "new" || body.status === "done") q.status = body.status;
    return q;
  });
  return result ? json(result) : fail("A megkeresés nem található.", 404);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  const { id } = await ctx.params;
  const removed = await mutate((db) => {
    const before = db.inquiries.length;
    db.inquiries = db.inquiries.filter((x) => x.id !== id);
    return db.inquiries.length < before;
  });
  return removed ? json({ ok: true }) : fail("A megkeresés nem található.", 404);
}
