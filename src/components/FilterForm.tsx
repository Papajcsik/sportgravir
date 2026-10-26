"use client";

import { useState } from "react";
import { useCatalogNav } from "./CatalogNav";

export type FilterState = { q: string; sort: string };

const toParams = (q: string, sort: string) => {
  const p = new URLSearchParams();
  if (q.trim()) p.set("q", q.trim());
  if (sort !== "ajanlott") p.set("rendez", sort);
  return p;
};

/**
 * Search and sort of a product list in one row. A GET form: every change swaps the list (see CatalogNav) and the URL carries the whole state,
 * so results are shareable and the back button works; without JavaScript the "Keresés" button submits the same form.
 */
export default function FilterForm({ state, action }: { state: FilterState; action: string }) {
  const { go } = useCatalogNav();
  const [q, setQ] = useState(state.q);
  const [seen, setSeen] = useState(state.q);
  if (seen !== state.q) {
    setSeen(state.q);
    setQ(state.q);
  }
  const [sort, setSort] = useState(state.sort);
  const [seenSort, setSeenSort] = useState(state.sort);
  if (seenSort !== state.sort) {
    setSeenSort(state.sort);
    setSort(state.sort);
  }
  return (
    <form
      action={action}
      method="get"
      aria-label="Keresés és rendezés"
      className="flex flex-wrap items-end gap-x-4 gap-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        go(toParams(q, sort));
      }}
    >
      <div className="min-w-[220px] flex-1">
        <label htmlFor="list-q" className="mb-1.5 block text-[15px] font-bold text-ink">
          Keresés ebben a listában
        </label>
        <input id="list-q" name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => q !== state.q && go(toParams(q, sort))} placeholder="termék neve, méret, szín…" className="field !py-2" autoComplete="off" />
      </div>
      <div>
        <label htmlFor="sort-sel" className="mb-1.5 block text-[15px] font-bold text-ink">
          Rendezés
        </label>
        <select
          id="sort-sel"
          name="rendez"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            go(toParams(q, e.target.value));
          }}
          className="field !w-auto !py-2"
        >
          <option value="ajanlott">Ajánlott</option>
          <option value="nev">Név szerint</option>
          <option value="ujabb">Legújabb</option>
        </select>
      </div>
      <button type="submit" className="btn-ink !px-6 !py-2">
        Keresés
      </button>
    </form>
  );
}
