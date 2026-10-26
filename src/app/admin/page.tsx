"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdmin } from "@/components/AdminProvider";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const { admin, signedIn, openWindow, signOut } = useAdmin();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "A belépés nem sikerült.");
        return;
      }
      await signedIn();
      router.push("/");
    } catch {
      setError("Nincs kapcsolat a szerverrel.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[78vh] items-center justify-center bg-paper px-5 py-16">
      <div className="w-full max-w-[420px] rounded-[12px] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <span className="mx-auto mb-4 flex w-fit rounded-sm bg-ink px-5 py-3">
          <Logo light />
        </span>
        <h1 className="text-center font-sans text-[22px] font-semibold uppercase tracking-[1px]">Admin</h1>

        {admin ? (
          <div className="mt-6 space-y-3 text-center">
            <p className="text-[15px]">Be van jelentkezve. A kezelőfelület a weboldal jobb szélén, az <strong>arany fülön</strong> érhető el.</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button type="button" className="h-10 rounded-[4px] bg-ink px-5 font-sans text-[13px] font-medium text-white hover:bg-gold hover:text-black" onClick={() => openWindow("inquiries")}>
                Rendelések megnyitása
              </button>
              <Link href="/" className="inline-flex h-10 items-center rounded-[4px] border border-[#bbb] px-5 font-sans text-[13px] font-medium hover:bg-paper">
                Webshop
              </Link>
              <button type="button" className="h-10 rounded-[4px] border border-[#d9a19a] px-5 font-sans text-[13px] font-medium text-[#a8281a] hover:bg-[#fdecea]" onClick={signOut}>
                Kijelentkezés
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-center text-[14px] text-[#555]">Termékek, oldalak és rendelések kezelése.</p>
            <div>
              <label htmlFor="admin-password" className="mb-1 block text-[12.5px] font-semibold uppercase tracking-[0.5px] text-[#555]">
                Jelszó
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[4px] border border-[#c4c4c4] px-3 py-3 text-[15px] outline-none focus:border-gold-dark focus:ring-2 focus:ring-gold/30"
                aria-describedby={error ? "admin-error" : undefined}
                aria-invalid={!!error}
              />
            </div>
            {error && (
              <p id="admin-error" role="alert" className="rounded-[4px] border border-[#c0392b] bg-[#fdecea] p-3 text-[14px] text-[#7a1f14]">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="h-12 w-full rounded-[4px] bg-ink font-sans text-[14px] font-medium uppercase tracking-[2px] text-white transition-colors hover:bg-gold hover:text-black disabled:opacity-60">
              {busy ? "Belépés…" : "Belépés"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
