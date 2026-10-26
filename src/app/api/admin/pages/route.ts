import { guardAdmin, json } from "@/lib/auth";
import { getAllPages } from "@/lib/store";

/** The list of all pages and articles for the admin table (without their content). */
export async function GET(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const pages = await getAllPages();
  const items = pages.map((p) => ({ id: p.id, path: p.path, title: p.title, kind: p.kind, custom: !!p.custom, hidden: !!p.hidden, updated: p.updated ?? null }));
  return json({ items });
}
