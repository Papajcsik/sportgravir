"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "../AdminProvider";
import type { Page } from "@/lib/pagetypes";
import { api } from "./api";
import { useToast } from "./Toast";
import { btnDanger, btnGhost, btnPrimary, inputCls, labelCls, Switch, useDialogBehavior, useMountTransition } from "./ui";

const card = "space-y-4 rounded-[10px] border border-[#dedbd3] bg-white p-4";

/** Page / article editor as a drawer over the page the admin is looking at: title, visibility and the text (HTML). "Eredeti" brings back the text of the live site. */
export default function PageEditor() {
  const { pageEditor: id, closePageEditor } = useAdmin();
  const open = id !== null;
  const { mounted, visible } = useMountTransition(open, 300);
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState("");
  const [hidden, setHidden] = useState(false);
  const [html, setHtml] = useState("");
  const [initial, setInitial] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const snapshot = useMemo(() => JSON.stringify({ title, hidden, html }), [title, hidden, html]);
  const dirty = page !== null && snapshot !== initial;
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const requestClose = useCallback(() => {
    if (dirtyRef.current && !confirm("Nem mentett módosításaid vannak. Biztosan bezárod?")) return;
    closePageEditor();
  }, [closePageEditor]);
  useDialogBehavior(open, ref, requestClose);

  useEffect(() => {
    if (id === null) return;
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const p = await api<Page>(`/api/admin/pages/${id}`);
        if (!alive) return;
        setPage(p);
        setTitle(p.title);
        setHidden(!!p.hidden);
        setHtml(p.html);
        setInitial(JSON.stringify({ title: p.title, hidden: !!p.hidden, html: p.html }));
      } catch (e) {
        toast((e as Error).message, "error");
        closePageEditor();
      } finally {
        if (alive) setLoading(false);
      }
    }, 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [id, toast, closePageEditor]);

  const save = async () => {
    if (title.trim().length < 2) return toast("Add meg az oldal címét.", "error");
    setSaving(true);
    try {
      await api(`/api/admin/pages/${page!.id}`, { method: "PUT", json: { title, hidden, html } });
      toast("Mentve");
      setInitial(snapshot);
      closePageEditor();
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!page?.custom) return;
    if (!confirm("Visszaállítja az eredeti (sportgravir.hu-s) szövegre? A módosítások elvesznek.")) return;
    try {
      await api(`/api/admin/pages/${page.id}`, { method: "DELETE" });
      toast("Eredeti szöveg visszaállítva");
      setInitial(snapshot);
      closePageEditor();
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`} onClick={requestClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Oldal szerkesztése"
        className={`absolute inset-y-0 right-0 flex w-[min(760px,100vw)] flex-col bg-[#f6f5f2] shadow-[-20px_0_60px_rgba(0,0,0,0.35)] transition-[translate,opacity] duration-300 ease-out ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
      >
        <div className="flex shrink-0 items-center gap-3 bg-ink px-4 py-3 text-white">
          <h2 className="mr-auto min-w-0 truncate font-sans text-[16px] font-medium">{page?.kind === "article" ? "Cikk" : "Oldal"} szerkesztése{page ? `: ${page.title}` : ""}</h2>
          {page && (
            <a href={`/${page.path}`} className="shrink-0 text-[12.5px] text-mist underline underline-offset-2 hover:text-gold">
              Megnyitás az oldalon
            </a>
          )}
          <button type="button" onClick={requestClose} className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10" aria-label="Szerkesztő bezárása">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
          {loading || !page ? (
            <p className="py-20 text-center text-[#666]">Betöltés…</p>
          ) : (
            <div className="space-y-5">
              <section className={card} aria-label="Alapadatok">
                <div>
                  <label htmlFor="pg-title" className={labelCls}>
                    Cím *
                  </label>
                  <input id="pg-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} data-autofocus />
                </div>
                <Switch checked={!hidden} onChange={(v) => setHidden(!v)} label="Látható a weboldalon" hint="Kikapcsolva az oldal nem érhető el, de nem vész el." />
              </section>
              <section className={card} aria-label="Szöveg">
                <label htmlFor="pg-html" className={labelCls}>
                  Szöveg (HTML)
                </label>
                <textarea id="pg-html" rows={Math.min(26, Math.max(8, Math.ceil(html.length / 90)))} value={html} onChange={(e) => setHtml(e.target.value)} className={`${inputCls} font-mono !text-[13px] leading-5`} spellCheck={false} />
                <p className="text-[12px] text-[#777]">Bekezdés: &lt;p&gt;…&lt;/p&gt;, alcím: &lt;h2&gt;…&lt;/h2&gt;, felsorolás: &lt;ul&gt;&lt;li&gt;…&lt;/li&gt;&lt;/ul&gt;, kiemelés: &lt;strong&gt;…&lt;/strong&gt;, link: &lt;a href=&quot;/rendeles&quot;&gt;…&lt;/a&gt;.</p>
              </section>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[#dedbd3] bg-white px-4 py-3">
          {page?.custom && (
            <button type="button" className={btnDanger} onClick={reset} disabled={loading || saving}>
              Eredeti
            </button>
          )}
          <span className="mr-auto text-[12.5px] text-[#777]" aria-live="polite">
            {dirty ? "Nem mentett módosítások" : ""}
          </span>
          <button type="button" className={btnGhost} onClick={requestClose}>
            Mégse
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={loading || saving || !dirty}>
            {saving ? "Mentés…" : "Mentés"}
          </button>
        </div>
      </div>
    </div>
  );
}
