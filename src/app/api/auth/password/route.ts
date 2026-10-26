import { fail, guardAdmin, json } from "@/lib/auth";
import { hashPassword, mutate, storageKind, verifyPassword } from "@/lib/store";

export async function POST(req: Request) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  if (storageKind === "temp") return fail("Ideiglenes tárhelyen a jelszó nem módosítható. Állítsa be az ADMIN_PASSWORD környezeti változót, vagy kapcsolja be a Redis tárhelyet.", 409);
  const body = (await req.json().catch(() => null)) as { current?: unknown; next?: unknown } | null;
  const current = typeof body?.current === "string" ? body.current : "";
  const next = typeof body?.next === "string" ? body.next : "";
  if (next.length < 8) return fail("Az új jelszó legalább 8 karakter legyen.");
  if (next.length > 200) return fail("Az új jelszó túl hosszú.");
  const result = await mutate((db) => {
    if (!verifyPassword(current, db.admin)) return false;
    db.admin = hashPassword(next);
    return true;
  });
  if (!result) return fail("A jelenlegi jelszó hibás.", 403);
  return json({ ok: true });
}
