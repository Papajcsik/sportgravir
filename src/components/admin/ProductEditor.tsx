"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { categories, catByPath } from "@/lib/categories";
import type { Product, ProductDetails } from "@/lib/products";
import { api } from "./api";
import { useToast } from "./Toast";
import { btnDanger, btnGhost, btnPrimary, inputCls, labelCls, Switch, useDialogBehavior, useMountTransition } from "./ui";

type Draft = {
  name: string;
  sku: string;
  cat: string;
  /** the short lines under the title ("br. 275 Ft/m"), one per line */
  note: string;
  /** one choice per line: "Hossz: 3m | 4m | 5m" */
  options: string;
  visible: boolean;
  desc: string;
  image: string;
  imageW: number;
  imageH: number;
};

const blank: Draft = {
  name: "",
  sku: "",
  cat: "tetokiegeszito",
  note: "",
  options: "",
  visible: true,
  desc: "",
  image: "/images/placeholder.svg",
  imageW: 600,
  imageH: 600,
};

type Full = Product & ProductDetails;

const fromProduct = (p: Full): Draft => ({
  name: p.name,
  sku: p.sku,
  cat: p.cat,
  note: p.note.join("\n"),
  options: p.options.map((o) => `${o.name}: ${o.values.join(" | ")}`).join("\n"),
  visible: p.visible,
  desc: (p.desc ?? []).join("\n"),
  image: p.image,
  imageW: p.imageW,
  imageH: p.imageH,
});

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

const toPayload = (d: Draft) => ({
  name: d.name,
  sku: d.sku,
  cat: d.cat,
  note: d.note,
  options: d.options,
  visible: d.visible,
  desc: lines(d.desc),
  image: d.image,
  imageW: d.imageW,
  imageH: d.imageH,
});

const card = "space-y-4 rounded-[10px] border border-[#dedbd3] bg-white p-4";

/**
 * Product editor as a drawer over the page the admin is looking at (no separate admin page to navigate to).
 * A live preview of the product row sits on top and updates while typing.
 */
export default function ProductEditor() {
  const { editor, closeEditor } = useAdmin();
  const open = editor !== null;
  const { mounted, visible } = useMountTransition(open, 300);
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [draft, setDraft] = useState<Draft>(blank);
  const [initial, setInitial] = useState<Draft>(blank);
  const [meta, setMeta] = useState<{ id: number | null; slug: string }>({ id: null, slug: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const requestClose = useCallback(() => {
    if (dirtyRef.current && !confirm("Nem mentett módosításaid vannak. Biztosan bezárod?")) return;
    closeEditor();
  }, [closeEditor]);

  useDialogBehavior(open, ref, requestClose);

  // load the product (or a blank form) whenever the editor is opened for something
  useEffect(() => {
    if (editor === null) return;
    let alive = true;
    const t = setTimeout(async () => {
      if (editor === "new") {
        setDraft(blank);
        setInitial(blank);
        setMeta({ id: null, slug: "" });
        return;
      }
      setLoading(true);
      try {
        const p = await api<Full>(`/api/admin/products/${editor}`);
        if (!alive) return;
        const d = fromProduct(p);
        setDraft(d);
        setInitial(d);
        setMeta({ id: p.id, slug: p.slug });
      } catch (e) {
        toast((e as Error).message, "error");
        closeEditor();
      } finally {
        if (alive) setLoading(false);
      }
    }, 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [editor, toast, closeEditor]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const upload = async (original: File | undefined) => {
    if (!original) return;
    setUploading(true);
    try {
      // big camera photos are shrunk in the browser first: faster, and hosts like Vercel cap request bodies at ~4.5 MB
      let file = original;
      if (original.size > 2.5 * 1024 * 1024 && typeof createImageBitmap === "function") {
        const bmp = await createImageBitmap(original);
        const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bmp.width * scale);
        canvas.height = Math.round(bmp.height * scale);
        canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.88));
        if (blob) file = new File([blob], "foto.webp", { type: "image/webp" });
      }
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ image: string; imageW: number; imageH: number }>("/api/admin/upload", { method: "POST", body: fd });
      setDraft((d) => ({ ...d, image: res.image, imageW: res.imageW, imageH: res.imageH }));
      toast("Kép feltöltve");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (draft.name.trim().length < 2) {
      toast("Add meg a termék nevét.", "error");
      return;
    }
    setSaving(true);
    try {
      if (meta.id === null) {
        const created = await api<Product>("/api/admin/products", { method: "POST", json: toPayload(draft) });
        toast(`„${created.name}” létrehozva`);
        setInitial(draft);
        closeEditor();
        router.push(`/termek/${created.slug}`);
        router.refresh();
      } else {
        await api<Product>(`/api/admin/products/${meta.id}`, { method: "PUT", json: toPayload(draft) });
        toast("Mentve");
        setInitial(draft);
        closeEditor();
        router.refresh();
      }
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (meta.id === null) return;
    if (!confirm(`Törlöd a(z) „${draft.name}” terméket a webáruházból?`)) return;
    try {
      await api(`/api/admin/products/${meta.id}`, { method: "DELETE" });
      toast("Termék törölve");
      setInitial(draft);
      closeEditor();
      if (pathname === `/termek/${meta.slug}`) router.push("/shop");
      else router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  if (!mounted) return null;

  const isNew = meta.id === null && editor === "new";

  return (
    <div className="fixed inset-0 z-[70]">
      <div className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`} onClick={requestClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? "Új termék" : "Termék szerkesztése"}
        className={`absolute inset-y-0 right-0 flex w-[min(600px,100vw)] flex-col bg-[#f6f5f2] shadow-[-20px_0_60px_rgba(0,0,0,0.35)] transition-[translate,opacity] duration-300 ease-out ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
      >
        <div className="flex shrink-0 items-center gap-3 bg-ink px-4 py-3 text-white">
          <h2 className="mr-auto font-sans text-[16px] font-medium">{isNew ? "Új termék" : "Termék szerkesztése"}</h2>
          {meta.slug && (
            <a href={`/termek/${meta.slug}`} className="text-[12.5px] text-mist underline underline-offset-2 hover:text-gold">
              Megnyitás az oldalon
            </a>
          )}
          <button type="button" onClick={requestClose} className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/10" aria-label="Szerkesztő bezárása">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
          {loading ? (
            <p className="py-20 text-center text-[#666]">Betöltés…</p>
          ) : (
            <div className="space-y-5">
              <div aria-label="Előnézet" className="rounded-[10px] border border-[#dedbd3] bg-white p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-[#888]">Előnézet</p>
                <div className="grid grid-cols-[110px_1fr] items-center gap-4">
                  <div className="relative h-[100px] rounded-lg bg-paper">
                    <Image src={draft.image} alt="" fill sizes="110px" className="object-contain p-1" unoptimized={draft.image.endsWith(".svg")} />
                  </div>
                  <div>
                    <p className="font-sans text-[11.5px] font-bold uppercase tracking-[1px] text-gold-dark">{catByPath(draft.cat)?.title}</p>
                    <p className="font-sans text-[16px] font-semibold leading-snug">{draft.name || "A termék neve"}</p>
                    {draft.note.trim() && <p className="mt-1 text-[13.5px] text-[#555]">{draft.note.split("\n")[0]}</p>}
                    <p className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                      {draft.options.trim() && <span className="rounded-full bg-[#e4efe8] px-2 py-0.5">{draft.options.split("\n").filter(Boolean).length} választható tulajdonság</span>}
                      {!draft.visible && <span className="rounded-full bg-[#ddd] px-2 py-0.5">rejtett</span>}
                    </p>
                  </div>
                </div>
              </div>

              <section className={card} aria-label="Alapadatok">
                <div>
                  <label htmlFor="pe-name" className={labelCls}>
                    Név *
                  </label>
                  <input id="pe-name" value={draft.name} onChange={(e) => set("name", e.target.value)} className={inputCls} data-autofocus placeholder="pl. Klasszikus serleg 111" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label htmlFor="pe-sku" className={labelCls}>
                      Kód
                    </label>
                    <input id="pe-sku" value={draft.sku} onChange={(e) => set("sku", e.target.value)} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="pe-cat" className={labelCls}>
                      Fő kategória
                    </label>
                    <select id="pe-cat" value={draft.cat} onChange={(e) => set("cat", e.target.value)} className={inputCls}>
                      {categories.map((c) => (
                        <option key={c.path} value={c.path}>
                          {"\u00a0\u00a0".repeat(c.path.split("/").length - 1)}
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-[10px] border border-[#dedbd3] bg-white p-4" aria-label="Fotó">
                <p className={labelCls}>Borítókép</p>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    upload(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex items-center gap-4 rounded-[8px] border-2 border-dashed p-3 transition-colors ${drag ? "border-gold bg-gold/10" : "border-[#cfcbbf]"}`}
                >
                  <div className="relative size-[84px] shrink-0 rounded-lg bg-paper">
                    <Image src={draft.image} alt="Jelenlegi borítókép" fill sizes="84px" className="object-contain p-1" unoptimized={draft.image.endsWith(".svg")} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] leading-5">Húzd ide az új képet, vagy válassz fájlt.</p>
                    <label className={`${btnGhost} mt-2 cursor-pointer !h-9`}>
                      {uploading ? "Feltöltés…" : "Kép cseréje"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} disabled={uploading} />
                    </label>
                  </div>
                </div>
              </section>

              <section className={card} aria-label="Megjelenés">
                <Switch checked={draft.visible} onChange={(v) => set("visible", v)} label="Látható a webáruházban" hint="Kikapcsolva a látogatók nem látják, de nem veszik el." />
              </section>

              <section className={card} aria-label="Leírás">
                <div>
                  <label htmlFor="pe-desc" className={labelCls}>
                    Részletes leírás
                  </label>
                  <textarea id="pe-desc" rows={8} value={draft.desc} onChange={(e) => set("desc", e.target.value)} className={inputCls} placeholder={"Minden sor külön bekezdés.\nA „## ” kezdetű sor alcím, a „- ” kezdetű sor felsorolás-elem."} />
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[#dedbd3] bg-white px-4 py-3">
          {!isNew && (
            <button type="button" className={btnDanger} onClick={remove} disabled={loading || saving}>
              Törlés
            </button>
          )}
          <span className="mr-auto text-[12.5px] text-[#777]" aria-live="polite">
            {dirty ? "Nem mentett módosítások" : ""}
          </span>
          <button type="button" className={btnGhost} onClick={requestClose}>
            Mégse
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={loading || saving || uploading}>
            {saving ? "Mentés…" : isNew ? "Termék létrehozása" : "Mentés"}
          </button>
        </div>
      </div>
    </div>
  );
}
