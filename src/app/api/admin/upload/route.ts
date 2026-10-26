import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { fail, guardAdmin, json } from "@/lib/auth";
import { saveUpload } from "@/lib/store";

const MAX_BYTES = 8 * 1024 * 1024;

/** Product photo upload: re-encoded to WebP (max 1600px, metadata stripped) and kept by the data store (disk or Redis). */
export async function POST(req: Request) {
  const denied = await guardAdmin(req, true);
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Nincs feltöltött fájl.");
  if (file.size > MAX_BYTES) return fail("A kép legfeljebb 8 MB lehet.");
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return fail("Csak JPG, PNG vagy WebP kép tölthető fel.");

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const { data, info } = await sharp(input, { limitInputPixels: 60_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 90 })
      .toBuffer({ resolveWithObject: true });
    const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.webp`;
    await saveUpload(name, data);
    return json({ image: `/uploads/${name}`, imageW: info.width, imageH: info.height });
  } catch {
    return fail("A kép nem dolgozható fel – próbáljon másikat.");
  }
}
