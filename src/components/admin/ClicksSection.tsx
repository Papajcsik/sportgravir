"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { useToast } from "./Toast";

type Range = "day" | "month" | "quarter" | "half" | "year" | "all";
type Clicks = {
  range: Range;
  from: string;
  to: string;
  total: number;
  unit: "day" | "week" | "month";
  rows: { id: number; name: string; visible: boolean; clicks: number }[];
  series: { label: string; clicks: number }[];
};

const ranges: { id: Range; label: string }[] = [
  { id: "day", label: "Ma" },
  { id: "month", label: "30 nap" },
  { id: "quarter", label: "3 hónap" },
  { id: "half", label: "6 hónap" },
  { id: "year", label: "1 év" },
  { id: "all", label: "Mindig" },
];
const unitLabel = { day: "naponta", week: "hetente", month: "havonta" } as const;

export default function ClicksSection() {
  const { toast } = useToast();
  const [range, setRange] = useState<Range>("month");
  const [data, setData] = useState<Clicks | null>(null);

  useEffect(() => {
    let alive = true;
    api<Clicks>(`/api/admin/clicks?range=${range}`)
      .then((d) => alive && setData(d))
      .catch((e) => toast((e as Error).message, "error"));
    return () => {
      alive = false;
    };
  }, [range, toast]);

  const stale = data && data.range !== range;
  const max = Math.max(1, ...(data?.rows.map((r) => r.clicks) ?? [1]));
  const W = 640;
  const H = 120;
  const sMax = Math.max(1, ...(data?.series.map((s) => s.clicks) ?? [1]));

  return (
    <section className="rounded-[10px] border border-[#dedbd3] bg-white p-4" aria-labelledby="clicks-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="clicks-title" className="text-[13px] font-bold uppercase tracking-[1px] text-[#777]">
            Kattintások termékenként
          </h3>
          <p className="mt-1 max-w-[520px] text-[12.5px] leading-5 text-[#777]">Ahányszor valaki megnyitotta a termék oldalát. Egy látogatót termékenként 30 percenként egyszer számolunk, az admin saját kattintásait nem.</p>
        </div>
        <div role="group" aria-label="Időszak" className="flex flex-wrap gap-1.5">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className={`min-h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${range === r.id ? "border-ink bg-ink text-white" : "border-[#c4c4c4] bg-white text-ink-2 hover:border-ink"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <p className="py-10 text-center text-[14px] text-[#666]">Betöltés…</p>
      ) : (
        <div className={`mt-4 transition-opacity ${stale ? "opacity-50" : ""}`} aria-busy={!!stale}>
          <p className="text-[14px]" aria-live="polite">
            <span className="font-sans text-[26px] font-semibold tabular-nums">{data.total}</span> kattintás összesen
            <span className="text-[#777]">
              {" "}
              · {data.from === data.to ? data.to : `${data.from} – ${data.to}`}
            </span>
          </p>

          {data.series.length > 1 && (
            <>
              <svg viewBox={`0 0 ${W} ${H + 20}`} className="mt-3 h-auto w-full" role="img" aria-label={`Kattintások ${unitLabel[data.unit]}, összesen ${data.total}`}>
                {[0.5, 1].map((f) => (
                  <line key={f} x1="0" x2={W} y1={H - H * f} y2={H - H * f} stroke="#eee" />
                ))}
                {data.series.map((s, i) => {
                  const bw = W / data.series.length;
                  const h = (s.clicks / sMax) * (H - 6);
                  return (
                    <rect key={s.label} x={i * bw + bw * 0.12} y={H - h} width={Math.max(1, bw * 0.76)} height={h} rx={Math.min(3, bw / 3)} fill={s.clicks ? "#c9a45c" : "#eee"}>
                      <title>
                        {s.label}: {s.clicks} kattintás
                      </title>
                    </rect>
                  );
                })}
                <text x="0" y={H + 15} fontSize="11" fill="#777">
                  {data.series[0].label}
                </text>
                <text x={W} y={H + 15} fontSize="11" fill="#777" textAnchor="end">
                  {data.series[data.series.length - 1].label}
                </text>
              </svg>
              <p className="text-[12px] text-[#777]">Oszlopok: {unitLabel[data.unit]}.</p>
            </>
          )}

          <ul className="mt-4 space-y-2.5">
            {data.rows.map((r) => (
              <li key={r.id}>
                <div className="flex justify-between gap-3 text-[14px]">
                  <span className="truncate">
                    {r.name}
                    {!r.visible && <span className="ml-2 text-[12px] text-[#999]">(rejtett)</span>}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{r.clicks}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eee]">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${(r.clicks / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
