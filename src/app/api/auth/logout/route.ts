import { cookieHeaders, json } from "@/lib/auth";

export async function POST() {
  return json({ ok: true }, { headers: cookieHeaders(null).map((c) => ["Set-Cookie", c] as [string, string]) });
}
