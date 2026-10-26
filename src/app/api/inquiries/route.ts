import { clientIp, fail, json, rateLimited, sameOrigin } from "@/lib/auth";
import { inquiryTypes, type Inquiry, type InquiryType } from "@/lib/products";
import { mutate, productsIn } from "@/lib/store";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[ \t]+/g, " ").trim().slice(0, max) : "");
const prefix: Record<InquiryType, string> = { ajanlat: "RE", kapcsolat: "UZ" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Public forms: orders (with the items of the order list and the text to engrave) and messages. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Érvénytelen kérés.", 403);
  if (rateLimited(`inq:${clientIp(req)}`, 8, 10 * 60 * 1000)) return fail("Túl sok üzenet rövid idő alatt. Próbáld újra később.", 429);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return fail("Hibás kérés.");
  if (typeof b.website === "string" && b.website) return json({ ok: true, number: "RE-0000" }); // honeypot
  const type = b.type as InquiryType;
  if (!inquiryTypes.includes(type)) return fail("Ismeretlen űrlap.");

  const name = str(b.name, 100);
  const email = str(b.email, 120);
  const phone = str(b.phone, 30);
  const message = str(b.message, 2500);
  if (name.length < 2) return fail("Add meg a neved.");
  if (phone.replace(/\D/g, "").length < 6) return fail("Add meg a telefonszámodat.");
  if (!EMAIL.test(email)) return fail("Add meg érvényes e-mail címedet, ide küldjük a látványtervet és a visszaigazolást.");
  if (b.consent !== true) return fail("Az adatkezelés elfogadása szükséges.");

  const rawLines = type === "ajanlat" && Array.isArray(b.lines) ? b.lines.slice(0, 80) : [];

  const result = await mutate((db) => {
    let subject = "";
    const details: string[] = [];

    if (type === "kapcsolat") {
      if (message.length < 5) return { error: "Írd le röviden, miben segíthetünk." };
      subject = message.slice(0, 80);
      details.push(message);
    } else {
      const byId = new Map(productsIn(db).map((p) => [p.id, p]));
      const lines: string[] = [];
      for (const l of rawLines as { id?: unknown; qty?: unknown; engrave?: unknown }[]) {
        const p = byId.get(Number(l?.id));
        const qty = Math.floor(Number(l?.qty));
        if (!p || !p.visible || !Number.isFinite(qty) || qty < 1) return { error: "A rendelési listában érvénytelen tétel van. Töltsd újra az oldalt." };
        const text = str(l.engrave, 300);
        lines.push(`${qty} × ${p.name}${p.sku ? ` (${p.sku})` : ""}${text ? ` – felirat: ${text}` : ""}`);
      }
      if (!lines.length && message.length < 5) return { error: "Írd le röviden, mit rendelnél, vagy tegyél termékeket a rendelési listába." };
      subject = lines.length ? `Rendelés: ${lines.length} tétel` : `Rendelés: ${message.slice(0, 60)}`;
      details.push(...lines);
      if (message) details.push(`Megjegyzés: ${message}`);
    }

    db.counters.inquiry += 1;
    const inq: Inquiry = {
      id: crypto.randomUUID(),
      number: `${prefix[type]}-${new Date().getFullYear()}-${String(db.counters.inquiry).padStart(4, "0")}`,
      createdAt: new Date().toISOString(),
      type,
      status: "new",
      name,
      email,
      phone,
      subject,
      details,
      adminNote: "",
    };
    db.inquiries.push(inq);
    return { inq };
  });

  if ("error" in result) return fail(result.error as string);
  return json({ ok: true, number: result.inq.number }, { status: 201 });
}
