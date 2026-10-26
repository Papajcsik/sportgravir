"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { useToast } from "./Toast";
import ClicksSection from "./ClicksSection";
import { inputCls } from "./ui";

type Stats = {
  days: number;
  quotes: number;
  messages: number;
  series: { date: string; quotes: number }[];
  top: { name: string; qty: number; requests: number }[];
  products: { total: number; hidden: number; edited: number };
  inquiries: { new: number; total: number };
};

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[10px] border border-[#dedbd3] bg-white p-4">
      <p className="text-[12px] font-bold uppercase tracking-[1px] text-[#777]">{label}</p>
      <p className="mt-1 font-sans text-[24px] font-semibold leading-tight tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[12.5px] text-[#777]">{sub}</p>}
    </div>
  );
}

export default function StatsTab() {
  const { toast } = useToast();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    api<Stats>(`/api/admin/stats?days=${days}`)
      .then((d) => alive && setData(d))
      .catch((e) => toast((e as Error).message, "error"));
    return () => {
      alive = false;
    };
  }, [days, toast]);

  if (!data) return <p className="py-16 text-center text-[#666]">Statisztika betöltése…</p>;

  const max = Math.max(1, ...data.series.map((s) => s.quotes));
  const W = 640;
  const H = 180;
  const bw = W / data.series.length;
  const topMax = Math.max(1, ...data.top.map((t) => t.requests));

  return (
    <div className="mx-auto max-w-[1000px] space-y-5 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-sans text-[18px] font-semibold">Áttekintés</h2>
        <label className="flex items-center gap-2 text-[13px]">
          Időszak
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={`${inputCls} !w-auto`}>
            <option value={7}>Utolsó 7 nap</option>
            <option value={30}>Utolsó 30 nap</option>
            <option value={90}>Utolsó 90 nap</option>
            <option value={365}>Utolsó 365 nap</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Rendelések" value={String(data.quotes)} sub="az időszakban" />
        <Card label="Üzenetek" value={String(data.messages)} sub="kapcsolatfelvétel" />
        <Card label="Kezelésre vár" value={String(data.inquiries.new)} sub={`összesen ${data.inquiries.total} megkeresés`} />
      </div>

      <section className="rounded-[10px] border border-[#dedbd3] bg-white p-4" aria-labelledby="chart-title">
        <h3 id="chart-title" className="mb-3 text-[13px] font-bold uppercase tracking-[1px] text-[#777]">
          Napi rendelések
        </h3>
        <svg viewBox={`0 0 ${W} ${H + 22}`} className="h-auto w-full" role="img" aria-label={`Napi rendelések az utolsó ${data.days} napban, összesen ${data.quotes}`}>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1="0" x2={W} y1={H - H * f} y2={H - H * f} stroke="#eee" />
          ))}
          {data.series.map((s, i) => {
            const h = (s.quotes / max) * (H - 8);
            return (
              <g key={s.date}>
                <rect x={i * bw + bw * 0.12} y={H - h} width={Math.max(1, bw * 0.76)} height={h} rx={Math.min(3, bw / 3)} fill={s.quotes ? "#24543a" : "#eee"}>
                  <title>
                    {s.date}: {s.quotes} rendelés
                  </title>
                </rect>
              </g>
            );
          })}
          <text x="0" y={H + 16} fontSize="11" fill="#777">
            {data.series[0].date}
          </text>
          <text x={W} y={H + 16} fontSize="11" fill="#777" textAnchor="end">
            {data.series[data.series.length - 1].date}
          </text>
        </svg>
        <table className="sr-only">
          <caption>Napi rendelések</caption>
          <tbody>
            {data.series.map((s) => (
              <tr key={s.date}>
                <th scope="row">{s.date}</th>
                <td>{s.quotes} rendelés</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ClicksSection />

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[10px] border border-[#dedbd3] bg-white p-4" aria-labelledby="top-title">
          <h3 id="top-title" className="mb-3 text-[13px] font-bold uppercase tracking-[1px] text-[#777]">
            Legtöbbet rendelt termékek
          </h3>
          {data.top.length === 0 ? (
            <p className="text-[14px] text-[#666]">Ebben az időszakban még nincs rendelés.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.top.map((t) => (
                <li key={t.name}>
                  <div className="flex justify-between gap-3 text-[14px]">
                    <span className="truncate">{t.name}</span>
                    <span className="shrink-0 tabular-nums text-[#555]">{t.requests} rendelés · {t.qty} egység</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eee]">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${(t.requests / topMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-[10px] border border-[#dedbd3] bg-white p-4" aria-labelledby="low-title">
          <h3 id="low-title" className="mb-3 text-[13px] font-bold uppercase tracking-[1px] text-[#777]">
            Kínálat
          </h3>
          <ul className="space-y-1 text-[14px]">
            <li className="flex justify-between gap-3">
              <span>Összes termék</span>
              <span className="font-semibold tabular-nums">{data.products.total}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span>Itt módosított vagy új</span>
              <span className="font-semibold tabular-nums">{data.products.edited}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span>Rejtett</span>
              <span className="font-semibold tabular-nums">{data.products.hidden}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
