import { guardAdmin, json } from "@/lib/auth";
import { budapestDay, getAllProducts, getClicks } from "@/lib/store";

const RANGES = { day: 1, month: 30, quarter: 90, half: 180, year: 365, all: 0 } as const;
type Range = keyof typeof RANGES;

const addDays = (key: string, n: number) => new Date(Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10) + n)).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export async function GET(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const param = new URL(req.url).searchParams.get("range") ?? "month";
  const range: Range = param in RANGES ? (param as Range) : "month";

  const [clicks, products] = await Promise.all([getClicks(), getAllProducts()]);
  const today = budapestDay();
  const allDays = Object.keys(clicks).sort();
  const from = range === "all" ? (allDays[0] ?? today) : addDays(today, -(RANGES[range] - 1));
  const span = daysBetween(from, today) + 1;

  // bucket the trend: days up to 90 days, weeks up to ~13 months, months beyond
  const unit: "day" | "week" | "month" = span <= 90 ? "day" : span <= 400 ? "week" : "month";
  const bucketOf = (day: string) => (unit === "day" ? day : unit === "month" ? day.slice(0, 7) : addDays(from, Math.floor(daysBetween(from, day) / 7) * 7));
  const series = new Map<string, number>();
  for (let i = 0; i < span; i++) {
    const k = bucketOf(addDays(from, i));
    if (!series.has(k)) series.set(k, 0);
  }

  const per = new Map<number, number>();
  let total = 0;
  for (const [day, row] of Object.entries(clicks)) {
    if (day < from || day > today) continue;
    for (const [id, n] of Object.entries(row)) {
      per.set(Number(id), (per.get(Number(id)) ?? 0) + n);
      total += n;
      const k = bucketOf(day);
      series.set(k, (series.get(k) ?? 0) + n);
    }
  }

  const known = new Set(products.map((p) => p.id));
  const rows = [
    ...products.map((p) => ({ id: p.id, name: p.name, visible: p.visible, clicks: per.get(p.id) ?? 0 })),
    ...[...per.entries()].filter(([id]) => !known.has(id)).map(([id, n]) => ({ id, name: "Törölt termék", visible: true, clicks: n })),
  ].filter((r) => r.clicks > 0).sort((a, b) => b.clicks - a.clicks || a.name.localeCompare(b.name, "hu")).slice(0, 200);

  return json({ range, from, to: today, total, unit, rows, series: [...series.entries()].map(([label, n]) => ({ label, clicks: n })) });
}
