import { revalidatePath } from "next/cache";
import { fail, guardAdmin, json } from "@/lib/auth";
import type { Settings } from "@/lib/products";
import { mutate, readDb, storageKind } from "@/lib/store";

export async function GET(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  return json({ ...(await readDb()).settings, storage: storageKind });
}

type Body = { notice?: unknown };
const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");

export async function PUT(req: Request) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return fail("Hibás kérés.");
  const settings = await mutate((db) => {
    const next: Settings = { notice: text(body.notice, 400) };
    db.settings = next;
    return next;
  });
  revalidatePath("/", "layout");
  return json(settings);
}
