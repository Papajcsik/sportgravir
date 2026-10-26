"use client";

import { useEffect, useRef, useState } from "react";

/** Mount/unmount with an exit animation: `mounted` keeps the node alive for `ms` after `open` turns false. */
export function useMountTransition(open: boolean, ms = 260) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      const a = setTimeout(() => setMounted(true), 0);
      const b = setTimeout(() => setVisible(true), 20);
      return () => {
        clearTimeout(a);
        clearTimeout(b);
      };
    }
    const a = setTimeout(() => setVisible(false), 0);
    const b = setTimeout(() => setMounted(false), ms);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [open, ms]);
  return { mounted: mounted || open, visible: visible && open };
}

/** Locks page scroll and traps/restores focus while a dialog is open. */
export function useDialogBehavior(open: boolean, ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const focusFirst = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const target = el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>("button, [href], input, select, textarea");
      target?.focus();
    }, 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const el = ref.current;
      if (!el) return;
      const f = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(focusFirst);
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [open, ref]);
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-gold" : "bg-[#c9c9c9]"}`}
      >
        <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
        <span className="sr-only">{label}</span>
      </button>
      <span className="text-[14px] leading-5" onClick={() => onChange(!checked)}>
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-[12.5px] text-[#666]">{hint}</span>}
      </span>
    </label>
  );
}

export const inputCls = "w-full rounded-[4px] border border-[#c4c4c4] bg-white px-3 py-2.5 text-[14px] leading-5 text-ink-2 outline-none transition-colors focus:border-moss focus:ring-2 focus:ring-moss/25";
export const labelCls = "mb-1 block text-[12.5px] font-semibold uppercase tracking-[0.5px] text-[#555]";
export const btnPrimary = "inline-flex h-10 items-center justify-center gap-2 rounded-[4px] bg-ink px-5 font-sans text-[13px] font-medium text-white transition-colors hover:bg-gold hover:text-ink disabled:opacity-50";
export const btnGhost = "inline-flex h-10 items-center justify-center gap-2 rounded-[4px] border border-[#bbb] px-4 font-sans text-[13px] font-medium text-ink-2 transition-colors hover:bg-paper disabled:opacity-50";
export const btnDanger = "inline-flex h-10 items-center justify-center gap-2 rounded-[4px] border border-[#d9a19a] px-4 font-sans text-[13px] font-medium text-[#a8281a] transition-colors hover:bg-[#fdecea] disabled:opacity-50";

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "most";
  if (s < 3600) return `${Math.floor(s / 60)} perce`;
  if (s < 86400) return `${Math.floor(s / 3600)} órája`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} napja`;
  return new Date(iso).toLocaleDateString("hu-HU");
}

export const fullDate = (iso: string) => new Date(iso).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
