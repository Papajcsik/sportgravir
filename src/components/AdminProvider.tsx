"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AdminTab = "inquiries" | "products" | "pages" | "stats" | "settings";

type AdminContextValue = {
  admin: boolean;
  newInquiries: number;
  setNewInquiries: (n: number) => void;
  windowTab: AdminTab | null;
  /** the tab shown last, kept while the window animates closed */
  lastTab: AdminTab;
  openWindow: (tab?: AdminTab) => void;
  closeWindow: () => void;
  /** product id, "new", or null when the editor drawer is closed */
  editor: number | "new" | null;
  openEditor: (id: number | "new") => void;
  closeEditor: () => void;
  /** page (or article) id, or null when the page editor drawer is closed */
  pageEditor: number | null;
  openPageEditor: (id: number) => void;
  closePageEditor: () => void;
  signedIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

// The admin interface (bar, window, editor) is a separate chunk: visitors never download it.
const AdminUI = dynamic(() => import("./admin/AdminUI"), { ssr: false });

const hasHint = () => typeof document !== "undefined" && document.cookie.split("; ").some((c) => c === "sportgravir_admin_hint=1");

export default function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState(false);
  const [newInquiries, setNewInquiries] = useState(0);
  const [windowTab, setWindowTab] = useState<AdminTab | null>(null);
  const [lastTab, setLastTab] = useState<AdminTab>("inquiries");
  const [editor, setEditor] = useState<number | "new" | null>(null);
  const [pageEditor, setPageEditor] = useState<number | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = (await res.json()) as { admin: boolean; newInquiries?: number };
      setAdmin(data.admin);
      setNewInquiries(data.newInquiries ?? 0);
      if (!data.admin) {
        setWindowTab(null);
        setEditor(null);
        setPageEditor(null);
      }
    } catch {
      // offline: keep the current state
    }
  }, []);

  // only browsers that have logged in before ask the server whether they are the admin
  useEffect(() => {
    if (!hasHint()) return;
    const t = setTimeout(refreshSession, 0);
    return () => clearTimeout(t);
  }, [refreshSession]);

  // poll for new inquiries (badge) while the admin is around, and notice an expired session
  useEffect(() => {
    if (!admin) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refreshSession();
    }, 30000);
    const expired = () => refreshSession();
    window.addEventListener("sportgravir:admin-expired", expired);
    return () => {
      clearInterval(id);
      window.removeEventListener("sportgravir:admin-expired", expired);
    };
  }, [admin, refreshSession]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setAdmin(false);
    setWindowTab(null);
    setEditor(null);
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({
      admin,
      newInquiries,
      setNewInquiries,
      windowTab,
      lastTab,
      openWindow: (tab = "inquiries") => {
        setEditor(null);
        setLastTab(tab);
        setWindowTab(tab);
      },
      closeWindow: () => setWindowTab(null),
      editor,
      openEditor: (id) => {
        setWindowTab(null);
        setEditor(id);
      },
      closeEditor: () => setEditor(null),
      pageEditor,
      openPageEditor: (id) => {
        setWindowTab(null);
        setEditor(null);
        setPageEditor(id);
      },
      closePageEditor: () => setPageEditor(null),
      signedIn: refreshSession,
      signOut,
    }),
    [admin, newInquiries, windowTab, lastTab, editor, pageEditor, refreshSession, signOut],
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
      {admin && <AdminUI />}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
