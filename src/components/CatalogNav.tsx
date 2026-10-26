"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useTransition } from "react";

type Nav = { pending: boolean; go: (params: URLSearchParams) => void };
const NavContext = createContext<Nav | null>(null);

/**
 * Applying a filter or a sort is a client-side navigation: the page is not reloaded, only the result list is re-rendered on the server and swapped in
 * (the URL still carries the whole state, so back / forward and sharing work). Without JavaScript the forms fall back to a normal GET.
 */
export function CatalogProvider({ action, children }: { action: string; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      start(() => router.push(qs ? `${action}?${qs}` : action, { scroll: false }));
    },
    [router, action],
  );
  const value = useMemo(() => ({ pending, go }), [pending, go]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useCatalogNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useCatalogNav must be used within CatalogProvider");
  return ctx;
}

/** The result area: dims and shows a thin progress bar while a new result list is on its way. */
export function ResultsPane({ labelledBy, children }: { labelledBy: string; children: React.ReactNode }) {
  const { pending } = useCatalogNav();
  return (
    <section aria-labelledby={labelledBy} aria-busy={pending} className="relative">
      <div aria-hidden="true" className={`absolute inset-x-0 -top-3 h-1 overflow-hidden rounded-full bg-ink/10 transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}>
        <div className="h-full w-1/3 progress-slide rounded-full bg-berry" />
      </div>
      <div className={`transition-opacity duration-200 ${pending ? "opacity-50" : "opacity-100"}`}>{children}</div>
    </section>
  );
}
