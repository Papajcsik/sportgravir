import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Which products of a quote basket still exist (the basket only remembers a snapshot). */
export async function GET(req: Request) {
  const ids = new Set(
    (new URL(req.url).searchParams.get("ids") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, 120),
  );
  const all = await getAllProducts();
  const items = all.filter((p) => ids.has(p.id) && p.visible).map((p) => ({ id: p.id, slug: p.slug, name: p.name, image: p.image, imageW: p.imageW, imageH: p.imageH }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
