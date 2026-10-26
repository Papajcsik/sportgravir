"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { api } from "./api";
import { useToast } from "./Toast";
import { btnGhost, inputCls, timeAgo } from "./ui";

type Row = { id: number; path: string; title: string; kind: "page" | "article"; custom: boolean; hidden: boolean; updated: string | null };
type Filter = "all" | "page" | "article" | "edited";

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Mind" },
  { id: "page", label: "Oldalak" },
  { id: "article", label: "Cikkek" },
  { id: "edited", label: "Módosított" },
];

/** The text pages (about, delivery, references, engraving) and the articles of the blog. */
export default function PagesTab() {
  const { openPageEditor } = useAdmin();
  const { toast } = useToast();
  const [items, setItems] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    api<{ items: Row[] }>("/api/admin/pages")
      .then((r) => setItems(r.items))
      .catch((e) => toast((e as Error).message, "error"));
  }, [toast]);

  const list = useMemo(() => {
    const f = fold(q.trim());
    return (items ?? []).filter((p) => (filter === "edited" ? p.custom : filter === "all" || p.kind === filter) && (!f || fold(p.title).includes(f) || p.path.includes(f)));
  }, [items, q, filter]);

  return (
    <div className="mx-auto max-w-[960px] p-3 sm:p-5">
      <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-4 space-y-2 bg-[#f6f5f2]/95 px-3 pb-3 pt-3 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5">
        <label htmlFor="page-search" className="sr-only">
          Oldal keresése
        </label>
        <input id="page-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Oldal vagy cikk címe…" className={inputCls} />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Oldalak szűrése">
          {filters.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors ${filter === f.id ? "border-ink bg-ink text-white" : "border-[#c9c6bd] bg-white hover:bg-[#eeece6]"}`}>
              {f.label}
            </button>
          ))}
          {items && <span className="ml-auto self-center text-[13px] text-[#666]">{list.length} tétel</span>}
        </div>
      </div>

      {items === null ? (
        <p className="py-16 text-center text-[#666]">Betöltés…</p>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-[#666]">Nincs találat.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((p) => (
            <li key={p.id} className={`grid grid-cols-[1fr_auto] items-center gap-3 rounded-[10px] border border-[#dedbd3] bg-white p-3 ${p.hidden ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <button type="button" onClick={() => openPageEditor(p.id)} className="block max-w-full truncate text-left font-sans text-[15px] font-semibold hover:text-gold-dark">
                  {p.title}
                </button>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#666]">
                  <span className="truncate">/{p.path}</span>
                  <span className="rounded-full bg-[#e8edf5] px-2 py-0.5 text-[11px] font-semibold text-[#172037]">{p.kind === "article" ? "cikk" : "oldal"}</span>
                  {p.custom && <span className="rounded-full bg-[#f6ecd2] px-2 py-0.5 text-[11px] font-semibold text-[#7a5a14]">módosítva{p.updated ? ` ${timeAgo(p.updated)}` : ""}</span>}
                  {p.hidden && <span className="rounded-full bg-[#ddd] px-2 py-0.5 text-[11px] font-semibold text-[#444]">rejtett</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Link href={`/${p.path}`} className={`${btnGhost} !h-9 !px-3 no-underline`}>
                  Megnyitás
                </Link>
                <button type="button" className={`${btnGhost} !h-9 !px-3`} onClick={() => openPageEditor(p.id)}>
                  Szerkesztés
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
