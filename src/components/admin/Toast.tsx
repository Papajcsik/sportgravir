"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "ok" | "error";
type ToastItem = { id: number; message: string; kind: ToastKind };
type ToastContextValue = { toast: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "ok") => {
    const id = Date.now() + Math.random();
    setItems((cur) => [...cur.slice(-3), { id, message, kind }]);
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), kind === "error" ? 6000 : 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto max-w-[460px] rounded-[6px] px-4 py-3 font-sans text-[14px] leading-5 text-white shadow-xl ${t.kind === "error" ? "bg-[#a8281a]" : "bg-ink"}`}
          >
            {t.kind === "ok" && <span className="mr-2 text-gold">✓</span>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
