import { clientIp, cookieHeaders, createSessionToken, fail, json, rateLimited, sameOrigin } from "@/lib/auth";
import { readDb, verifyPassword } from "@/lib/store";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Érvénytelen kérés.", 403);
  if (rateLimited(`login:${clientIp(req)}`, 8, 10 * 60 * 1000)) return fail("Túl sok próbálkozás, kérjük várjon pár percet.", 429);

  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  const db = await readDb();
  if (!password || !verifyPassword(password, db.admin)) {
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    return fail("Hibás jelszó.", 401);
  }
  const token = await createSessionToken();
  return json({ ok: true }, { headers: cookieHeaders(token).map((c) => ["Set-Cookie", c] as [string, string]) });
}
