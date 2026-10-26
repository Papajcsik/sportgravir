"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { categories, catByPath } from "@/lib/categories";
import type { Product } from "@/lib/products";
import { api } from "./api";
import { useToast } from "./Toast";
import { btnGhost, btnPrimary, inputCls } from "./ui";

type Page = { items: Product[]; total: number; page: number; pages: number };
type Filter = "all" | "hidden" | "edited";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Mind" },
  { id: "edited", label: "Módosított" },
  { id: "hidden", label: "Rejtett" },
];

const Eye = ({ off }: { off?: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {off ? <path d="M17.9 17.9A10.9 10.9 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22" /> : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />}
  </svg>
);

const iconBtn = "flex size-9 items-center justify-center rounded-full transition-colors hover:bg-[#ebe8df] disabled:opacity-30";

/* ------------------------------------------------------------------ tab */

export default function ProductsTab() {
  const { openEditor } = useAdmin();
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<Page | null>(null);
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [cat, setCat] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // search runs shortly after typing stops
  useEffect(() => {
    const t = setTimeout(() => {
      setApplied(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (applied) p.set("q", applied);
    if (cat) p.set("kat", cat);
    if (filter === "hidden") p.set("rejtett", "1");
    if (filter === "edited") p.set("modositott", "1");
    p.set("rendez", "nev");
    p.set("oldal", String(page));
    try {
      setData(await api<Page>(`/api/admin/products?${p}`));
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }, [applied, cat, filter, page, toast]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load, tick]);

  const reload = () => setTick((n) => n + 1);

  const save = async (p: Product, changes: Partial<Product>, msg: string) => {
    setBusyId(p.id);
    try {
      const updated = await api<Product>(`/api/admin/products/${p.id}`, { method: "PUT", json: { ...p, ...changes } });
      setData((cur) => (cur ? { ...cur, items: cur.items.map((x) => (x.id === p.id ? updated : x)) } : cur));
      toast(msg);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
      reload();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Törli a(z) „${p.name}” terméket a webáruházból? (Ha csak elrejteni szeretné, használja a szem ikont.)`)) return;
    try {
      await api(`/api/admin/products/${p.id}`, { method: "DELETE" });
      toast("Termék törölve");
      reload();
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-[1040px] p-3 sm:p-5">
      <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-4 space-y-2 bg-[#f6f5f2]/95 px-3 pb-3 pt-3 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="product-search" className="sr-only">
            Termék keresése
          </label>
          <input id="product-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Név, cikkszám…" className={`${inputCls} !w-auto min-w-[200px] flex-1`} />
          <label htmlFor="product-cat" className="sr-only">
            Kategória
          </label>
          <select
            id="product-cat"
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} !w-auto`}
          >
            <option value="">Minden kategória</option>
            {categories.map((c) => (
              <option key={c.path} value={c.path}>
                {"\u2003".repeat(c.path.split("/").length - 1)}
                {c.title}
              </option>
            ))}
          </select>
          <button type="button" className={btnPrimary} onClick={() => openEditor("new")}>
            + Új termék
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Termékek szűrése">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={`flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors ${filter === f.id ? "border-ink bg-ink text-white" : "border-[#c9c6bd] bg-white hover:bg-[#eeece6]"}`}
            >
              {f.label}
            </button>
          ))}
          {data && <span className="ml-auto self-center text-[13px] text-[#666]">{data.total.toLocaleString("hu-HU")} termék</span>}
        </div>
      </div>

      {data === null ? (
        <p className="py-16 text-center text-[#666]">Termékek betöltése…</p>
      ) : data.items.length === 0 ? (
        <p className="py-16 text-center text-[#666]">Nincs találat.</p>
      ) : (
        <>
          <p className="mb-2 px-1 text-[12.5px] text-[#666]">A szemmel elrejthet egy terméket a webáruházból; a „Szerkesztés” a nevet, kategóriát, kiszereléseket és a leírást is megnyitja.</p>
          <ul className="space-y-2">
            {data.items.map((p) => (
              <li key={p.id} className={`grid grid-cols-[56px_1fr] items-center gap-x-3 gap-y-2 rounded-[10px] border border-[#dedbd3] bg-white p-2.5 sm:grid-cols-[56px_1fr_auto] ${p.visible ? "" : "opacity-60"} ${busyId === p.id ? "animate-pulse" : ""}`}>
                <button type="button" onClick={() => openEditor(p.id)} className="relative block h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-paper" aria-label={`${p.name} szerkesztése`}>
                  <Image src={p.image} alt="" fill sizes="56px" className="object-contain p-1" />
                </button>
                <div className="min-w-0">
                  <button type="button" onClick={() => openEditor(p.id)} className="block max-w-full truncate text-left font-sans text-[14.5px] font-semibold hover:text-gold-dark">
                    {p.name}
                  </button>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-[#666]">
                    <span>{catByPath(p.cat)?.title ?? p.cat}</span>
                    <span>{p.sku}</span>
                    {p.custom && <span className="rounded-full bg-[#e6eef3] px-2 py-0.5 text-[11px] font-semibold text-[#1c3a4d]">módosított</span>}
                    {!p.visible && <span className="rounded-full bg-[#ddd] px-2 py-0.5 text-[11px] font-semibold text-[#444]">rejtett</span>}
                  </p>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-0.5 sm:col-span-1">
                  <button type="button" className={iconBtn} aria-pressed={!p.visible} title={p.visible ? "Elrejtés a webshopból" : "Megjelenítés a webshopban"} onClick={() => save(p, { visible: !p.visible }, p.visible ? `${p.name}: elrejtve` : `${p.name}: látható`)}>
                    <Eye off={!p.visible} />
                    <span className="sr-only">{p.visible ? "Elrejtés" : "Megjelenítés"}</span>
                  </button>
                  <button type="button" className={`${btnGhost} !h-9 !px-3`} onClick={() => openEditor(p.id)}>
                    Szerkesztés
                  </button>
                  <button type="button" className={`${iconBtn} text-[#a8281a]`} onClick={() => remove(p)} aria-label={`${p.name} törlése`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <nav aria-label="Oldalak" className="mt-5 flex items-center justify-center gap-3">
              <button type="button" className={btnGhost} disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>
                ← Előző
              </button>
              <span className="text-[13.5px] tabular-nums text-[#555]">
                {data.page} / {data.pages}
              </span>
              <button type="button" className={btnGhost} disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>
                Következő →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
