import { readUpload } from "@/lib/store";

/** Serves admin-uploaded product photos from the data store (files added after `next build` are not in /public). */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!/^[A-Za-z0-9._-]+\.(webp|jpg|png)$/.test(name)) return new Response("Not found", { status: 404 });
  const file = await readUpload(name);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: { "Content-Type": name.endsWith(".png") ? "image/png" : name.endsWith(".jpg") ? "image/jpeg" : "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
