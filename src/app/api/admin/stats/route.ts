import { guardAdmin, json } from "@/lib/auth";
import { getAllProducts, readDb } from "@/lib/store";

export async function GET(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const daysParam = Number(new URL(req.url).searchParams.get("days"));
  const days = [7, 30, 90, 365].includes(daysParam) ? daysParam : 30;
  const db = await readDb();
  const products = await getAllProducts();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const series: { date: string; quotes: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    series.push({ date: dayKey(d), quotes: 0 });
  }
  const byDay = new Map(series.map((s) => [s.date, s]));
  const inPeriod = db.inquiries.filter((q) => new Date(q.createdAt) >= start);
  for (const q of inPeriod) {
    if (q.type !== "ajanlat") continue;
    const s = byDay.get(dayKey(new Date(q.createdAt)));
    if (s) s.quotes += 1;
  }

  // most requested products: the "N × name (options)" lines of the quote requests
  const top = new Map<string, { name: string; qty: number; requests: number }>();
  for (const q of inPeriod) {
    if (q.type !== "ajanlat") continue;
    for (const line of q.details) {
      const m = /^(\d+) × (.+?)(?: \(.*\))?$/.exec(line);
      if (!m) continue;
      const t = top.get(m[2]) ?? { name: m[2], qty: 0, requests: 0 };
      t.qty += Number(m[1]);
      t.requests += 1;
      top.set(m[2], t);
    }
  }

  return json({
    days,
    quotes: inPeriod.filter((q) => q.type === "ajanlat").length,
    messages: inPeriod.filter((q) => q.type === "kapcsolat").length,
    series,
    top: [...top.values()].sort((a, b) => b.requests - a.requests || b.qty - a.qty).slice(0, 8),
    products: {
      total: products.length,
      hidden: products.filter((p) => !p.visible).length,
      edited: products.filter((p) => p.custom).length,
    },
    inquiries: {
      new: db.inquiries.filter((q) => q.status === "new").length,
      total: db.inquiries.length,
    },
  });
}
