"use client";

import { useEffect, useRef, useState } from "react";
import { type AdminTab, useAdmin } from "../AdminProvider";

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d={d} />
  </svg>
);

const icons = {
  plus: "M12 5v14M5 12h14",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z",
  orders: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  products: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  stats: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  tool: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z",
};

/**
 * The admin's way into everything: a tab on the right edge of the normal site that opens a menu on hover (desktop),
 * tap or keyboard focus. Inquiries, products, statistics and settings open as a window over the page the admin is on.
 */
export default function AdminBar() {
  const { newInquiries, openWindow, openEditor, signOut, windowTab, editor, pageEditor } = useAdmin();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (windowTab || editor !== null || pageEditor !== null) return null;

  const go = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  const tab = (t: AdminTab) => go(() => openWindow(t));

  const items: { label: string; icon: string; onClick: () => void; badge?: number }[] = [
    { label: "Új termék", icon: icons.plus, onClick: go(() => openEditor("new")) },
    { label: "Rendelések", icon: icons.inbox, onClick: tab("inquiries"), badge: newInquiries },
    { label: "Termékek", icon: icons.products, onClick: tab("products") },
    { label: "Oldalak, cikkek", icon: icons.orders, onClick: tab("pages") },
    { label: "Statisztika", icon: icons.stats, onClick: tab("stats") },
    { label: "Beállítások", icon: icons.settings, onClick: tab("settings") },
  ];

  return (
    <div
      ref={wrapRef}
      className="fixed right-0 top-[38%] z-[60] flex items-start"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        closeTimer.current = setTimeout(() => setOpen(false), 250);
      }}
    >
      <nav
        id="admin-menu"
        aria-label="Admin menü"
        inert={!open}
        className={`mr-2 w-[236px] origin-right rounded-[12px] border border-gold/40 bg-ink p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-[opacity,translate,scale,visibility] duration-300 ease-out ${
          open ? "visible translate-x-0 scale-100 opacity-100" : "invisible translate-x-6 scale-95 opacity-0"
        }`}
      >
        <p className="px-3 pb-2 pt-1 font-sans text-[11px] font-bold uppercase tracking-[2px] text-gold">Admin mód</p>
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li key={it.label} className={`transition-[opacity,translate] duration-300 ${open ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"}`} style={{ transitionDelay: open ? `${60 + i * 40}ms` : "0ms" }}>
              <button type="button" onClick={it.onClick} className="relative flex min-h-11 w-full items-center gap-3 rounded-[8px] px-3 text-left font-sans text-[14px] text-white transition-colors hover:bg-white/10 focus-visible:bg-white/10">
                <Icon d={it.icon} />
                {it.label}
                {!!it.badge && <span className="ml-auto flex min-w-[22px] items-center justify-center rounded-full bg-[#e53935] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{it.badge}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-white/15 pt-2">
          <button type="button" onClick={go(signOut)} className="flex min-h-11 w-full items-center gap-3 rounded-[8px] px-3 text-left font-sans text-[14px] text-mist transition-colors hover:bg-white/10">
            <Icon d={icons.out} />
            Kijelentkezés
          </button>
        </div>
      </nav>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="admin-menu"
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-[58px] items-center justify-center rounded-l-[16px] bg-gold text-ink shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-[filter,width] hover:brightness-110"
        style={{ order: 2 }}
      >
        <span className="sr-only">{open ? "Admin menü bezárása" : `Admin menü megnyitása${newInquiries ? `, ${newInquiries} új tétel` : ""}`}</span>
        <Icon d={icons.tool} />
        {newInquiries > 0 && <span className="admin-badge absolute -left-2 -top-2 flex min-w-[22px] items-center justify-center rounded-full bg-[#e53935] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{newInquiries}</span>}
      </button>
    </div>
  );
}
