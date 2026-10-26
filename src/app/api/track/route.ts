import { clientIp, isAdmin, json, rateLimited, sameOrigin } from "@/lib/auth";
import { getProductBySlug, recordClick } from "@/lib/store";

const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|curl|wget|python|httpclient/i;

/** Counts one product open for the admin statistics. Anonymous: no cookie, no IP stored. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ ok: false }, { status: 403 });
  const quiet = json({ ok: true });
  if (BOT.test(req.headers.get("user-agent") ?? "")) return quiet;
  if (rateLimited(`track:${clientIp(req)}`, 120, 10 * 60 * 1000)) return quiet;
  if (await isAdmin(req)) return quiet; // the owner clicking around does not count

  const b = (await req.json().catch(() => null)) as { slug?: unknown } | null;
  const slug = typeof b?.slug === "string" ? b.slug.slice(0, 120) : "";
  const p = slug ? await getProductBySlug(slug) : undefined;
  if (p && p.visible) await recordClick(p.id).catch(() => undefined);
  return quiet;
}
