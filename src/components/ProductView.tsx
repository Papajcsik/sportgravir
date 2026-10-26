"use client";

import { useEffect } from "react";

const WINDOW_MS = 30 * 60 * 1000;

/** Tells the server that this product page was opened (admin click statistics). Counted once per visitor per 30 minutes. */
export default function ProductView({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `sportgravir-view:${slug}`;
    try {
      const last = Number(sessionStorage.getItem(key) ?? 0);
      if (last && Date.now() - last < WINDOW_MS) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // storage blocked: count every open
    }
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }), keepalive: true }).catch(() => undefined);
  }, [slug]);
  return null;
}
