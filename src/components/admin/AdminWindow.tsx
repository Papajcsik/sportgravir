"use client";

import { useRef } from "react";
import { type AdminTab, useAdmin } from "../AdminProvider";
import InquiriesTab from "./InquiriesTab";
import PagesTab from "./PagesTab";
import ProductsTab from "./ProductsTab";
import SettingsTab from "./SettingsTab";
import StatsTab from "./StatsTab";
import { useDialogBehavior, useMountTransition } from "./ui";

const tabs: { id: AdminTab; label: string }[] = [
  { id: "inquiries", label: "Rendelések" },
  { id: "products", label: "Termékek" },
  { id: "pages", label: "Oldalak, cikkek" },
  { id: "stats", label: "Statisztika" },
  { id: "settings", label: "Beállítások" },
];

/** The admin window: one dialog with inquiries, products, statistics and settings, opened over whatever page the admin is on. */
export default function AdminWindow() {
  const { windowTab, lastTab, openWindow, closeWindow, newInquiries } = useAdmin();
  const open = windowTab !== null;
  const { mounted, visible } = useMountTransition(open, 280);
  const ref = useRef<HTMLDivElement>(null);
  useDialogBehavior(open, ref, closeWindow);

  if (!mounted) return null;
  const active = windowTab ?? lastTab;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`} onClick={closeWindow} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Admin ablak"
        className={`absolute inset-0 flex flex-col overflow-hidden bg-white shadow-2xl transition-[opacity,translate,scale] duration-300 ease-out sm:inset-5 sm:rounded-[14px] lg:inset-x-[max(2rem,calc((100vw-1120px)/2))] lg:inset-y-8 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-center gap-2 bg-ink px-3 sm:px-5">
          <div role="tablist" aria-label="Admin szakaszok" className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: "none" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                id={`admin-tab-${t.id}`}
                aria-selected={active === t.id}
                aria-controls={`admin-panel-${t.id}`}
                onClick={() => openWindow(t.id)}
                data-autofocus={active === t.id ? "" : undefined}
                className={`relative flex min-h-11 shrink-0 items-center gap-2 rounded-[6px] px-3.5 font-sans text-[14px] transition-colors sm:px-4 ${
                  active === t.id ? "bg-gold text-ink" : "text-white hover:bg-white/10"
                }`}
              >
                {t.label}
                {t.id === "inquiries" && newInquiries > 0 && <span className="rounded-full bg-[#e53935] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{newInquiries}</span>}
              </button>
            ))}
          </div>
          <button type="button" onClick={closeWindow} className="flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10" aria-label="Admin ablak bezárása">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <div role="tabpanel" id={`admin-panel-${active}`} aria-labelledby={`admin-tab-${active}`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f6f5f2]">
          {active === "inquiries" && <InquiriesTab />}
          {active === "products" && <ProductsTab />}
          {active === "pages" && <PagesTab />}
          {active === "stats" && <StatsTab />}
          {active === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
