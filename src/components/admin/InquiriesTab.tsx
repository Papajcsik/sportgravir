"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { type Inquiry, type InquiryType, inquiryLabel, inquiryTypes } from "@/lib/products";
import { api } from "./api";
import { useToast } from "./Toast";
import { btnGhost, btnPrimary, fullDate, inputCls, timeAgo } from "./ui";

type Filter = "open" | "done" | "all";
const filters: { id: Filter; label: string }[] = [
  { id: "open", label: "Új" },
  { id: "done", label: "Elintézett" },
  { id: "all", label: "Mind" },
];

const typeChip: Record<InquiryType, string> = {
  ajanlat: "bg-[#8a1f2b] text-white",
  kapcsolat: "bg-[#555] text-white",
};

function Card({ q, open, onToggle, onChange, onDelete }: { q: Inquiry; open: boolean; onToggle: () => void; onChange: (q: Inquiry) => void; onDelete: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(q.adminNote);

  const patch = async (body: { status?: "new" | "done"; adminNote?: string }, ok: string) => {
    setBusy(true);
    try {
      onChange(await api<Inquiry>(`/api/admin/inquiries/${q.id}`, { method: "PATCH", json: body }));
      toast(ok);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`overflow-hidden rounded-[10px] border bg-white shadow-sm ${q.status === "new" ? "border-l-4 border-[#e53935]/80" : "border-[#dedbd3]"} ${open ? "shadow-md" : ""}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3.5 text-left hover:bg-[#fbfaf7] sm:grid-cols-[130px_auto_1fr_auto]">
        <span className="font-sans text-[14px] font-semibold">{q.number}</span>
        <span className={`order-2 justify-self-end rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none sm:order-none sm:justify-self-start ${typeChip[q.type]}`}>{inquiryLabel[q.type]}</span>
        <span className="order-3 col-span-2 min-w-0 truncate text-[14px] sm:order-none sm:col-span-1">
          {q.name} <span className="text-[#777]">· {q.subject} · {timeAgo(q.createdAt)}</span>
        </span>
        <span />
      </button>
      {open && (
        <div className="admin-expand border-t border-[#ece9e1] px-4 pb-4 pt-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5 text-[14px] leading-6">
              <h4 className="mb-1 text-[12px] font-bold uppercase tracking-[1px] text-[#777]">Beküldő</h4>
              <p className="font-medium">{q.name}</p>
              <p>
                {q.phone && (
                  <a href={`tel:${q.phone}`} className="underline underline-offset-2">
                    {q.phone}
                  </a>
                )}
                {q.phone && q.email ? " · " : ""}
                {q.email && (
                  <a href={`mailto:${q.email}`} className="underline underline-offset-2">
                    {q.email}
                  </a>
                )}
              </p>
              <p className="text-[12.5px] text-[#777]">Beérkezett: {fullDate(q.createdAt)}</p>
            </div>
            <div>
              <h4 className="mb-1 text-[12px] font-bold uppercase tracking-[1px] text-[#777]">Részletek</h4>
              <ul className="space-y-1 text-[14px] leading-6">
                {q.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor={`qnote-${q.id}`} className="mb-1 block text-[12px] font-bold uppercase tracking-[1px] text-[#777]">
              Belső jegyzet (a beküldő nem látja)
            </label>
            <textarea id={`qnote-${q.id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="pl. visszahívtam, a darab az üzletben megtekinthető" />
            {note !== q.adminNote && (
              <button type="button" className={`${btnGhost} mt-2 !h-9`} disabled={busy} onClick={() => patch({ adminNote: note }, "Jegyzet mentve")}>
                Jegyzet mentése
              </button>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {q.status === "new" ? (
              <button type="button" className={btnPrimary} disabled={busy} onClick={() => patch({ status: "done" }, `${q.number}: elintézve`)}>
                Elintézve
              </button>
            ) : (
              <button type="button" className={btnGhost} disabled={busy} onClick={() => patch({ status: "new" }, `${q.number}: újra nyitva`)}>
                Újranyitás
              </button>
            )}
            <button
              type="button"
              className="ml-auto text-[12.5px] text-[#a8281a] underline underline-offset-2"
              onClick={() => {
                if (confirm(`Végleg törli a(z) ${q.number} megkeresést?`)) onDelete();
              }}
            >
              Törlés
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Contact messages and questions about a piece. */
export default function InquiriesTab() {
  const { setNewInquiries } = useAdmin();
  const { toast } = useToast();
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [type, setType] = useState<"all" | InquiryType>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ inquiries: Inquiry[]; newInquiries: number }>("/api/admin/inquiries");
      setItems(data.inquiries);
      setNewInquiries(data.newInquiries);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }, [setNewInquiries, toast]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(() => document.visibilityState === "visible" && load(), 15000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  const counts = useMemo(() => ({ open: (items ?? []).filter((q) => q.status === "new").length, done: (items ?? []).filter((q) => q.status === "done").length, all: items?.length ?? 0 }), [items]);
  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (items ?? []).filter((q) => {
      if (filter === "open" && q.status !== "new") return false;
      if (filter === "done" && q.status !== "done") return false;
      if (type !== "all" && q.type !== type) return false;
      return !s || [q.number, q.name, q.email, q.phone, q.subject, ...q.details].some((x) => x.toLowerCase().includes(s));
    });
  }, [items, filter, type, search]);

  const replace = (q: Inquiry) => {
    const next = (items ?? []).map((x) => (x.id === q.id ? q : x));
    setItems(next);
    setNewInquiries(next.filter((x) => x.status === "new").length);
  };
  const remove = async (q: Inquiry) => {
    try {
      await api(`/api/admin/inquiries/${q.id}`, { method: "DELETE" });
      const next = (items ?? []).filter((x) => x.id !== q.id);
      setItems(next);
      setNewInquiries(next.filter((x) => x.status === "new").length);
      toast("Megkeresés törölve");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-[900px] p-3 sm:p-5">
      <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-4 space-y-3 bg-[#f6f5f2]/95 px-3 pb-3 pt-3 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="inq-search" className="sr-only">
            Keresés a megkeresések között
          </label>
          <input id="inq-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Keresés: név, azonosító, telefon, tartalom…" className={`${inputCls} !w-auto min-w-[200px] flex-1`} />
          <label htmlFor="inq-type" className="sr-only">
            Típus
          </label>
          <select id="inq-type" value={type} onChange={(e) => setType(e.target.value as "all" | InquiryType)} className={`${inputCls} !w-auto`}>
            <option value="all">Minden típus</option>
            {inquiryTypes.map((t) => (
              <option key={t} value={t}>
                {inquiryLabel[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Megkeresések szűrése">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${filter === f.id ? "border-ink bg-ink text-white" : "border-[#c9c6bd] bg-white hover:bg-[#eeece6]"}`}
            >
              {f.label}
              <span className={`text-[11.5px] ${filter === f.id ? "text-gold" : "text-[#777]"}`}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {items === null ? (
        <p className="py-16 text-center text-[#666]">Megkeresések betöltése…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-[#c9c6bd] bg-white px-6 py-14 text-center">
          <p className="font-sans text-[16px] font-medium">{items.length === 0 ? "Még nem érkezett megkeresés." : "Nincs a szűrésnek megfelelő megkeresés."}</p>
          <p className="mt-1 text-[14px] text-[#666]">Ide érkeznek az üzenetek és a darabokra vonatkozó kérdések.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {shown.map((q) => (
            <Card key={q.id} q={q} open={openId === q.id} onToggle={() => setOpenId(openId === q.id ? null : q.id)} onChange={replace} onDelete={() => remove(q)} />
          ))}
        </ul>
      )}
    </div>
  );
}
