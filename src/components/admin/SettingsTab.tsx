"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { defaultSettings, type Settings } from "@/lib/products";
import { api } from "./api";
import { useToast } from "./Toast";
import { btnDanger, btnGhost, btnPrimary, inputCls, labelCls } from "./ui";

export default function SettingsTab() {
  const { toast } = useToast();
  const { signOut, closeWindow } = useAdmin();
  const router = useRouter();
  const [notice, setNotice] = useState(defaultSettings.notice);
  const [loaded, setLoaded] = useState(false);
  const [storage, setStorage] = useState<"redis" | "file" | "temp" | null>(null);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    api<Settings & { storage: "redis" | "file" | "temp" }>("/api/admin/settings")
      .then((r) => {
        setStorage(r.storage);
        setNotice(r.notice);
        setLoaded(true);
      })
      .catch((e) => toast((e as Error).message, "error"));
  }, [toast]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/settings", { method: "PUT", json: { notice } });
      toast("Beállítások mentve");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwBusy(true);
    try {
      await api("/api/auth/password", { method: "POST", json: { current, next } });
      setCurrent("");
      setNext("");
      toast("Jelszó megváltoztatva");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[760px] space-y-5 p-3 sm:p-5">
      {storage === "temp" && (
        <div role="alert" className="rounded-[10px] border border-[#e0b04a] bg-[#fff6dd] p-4 text-[14px] leading-6 text-[#5c4300]">
          <p className="font-semibold">Ideiglenes tárhely</p>
          <p>
            Ez a szerver nem tud tartósan fájlt írni, ezért a módosítások (termékek, oldalak, rendelések) elveszhetnek. Éles használathoz kapcsolja be a tartós tárhelyet: Vercel → Storage → Upstash Redis, majd indítsa újra a telepítést.
          </p>
        </div>
      )}
      <form onSubmit={save} className="space-y-5">
        <section className="rounded-[10px] border border-[#dedbd3] bg-white p-5">
          <h2 className="font-sans text-[16px] font-semibold">Közlemény</h2>
          <p className="mt-1 text-[13.5px] text-[#666]">Megjelenik a főoldal tetején és a listák fölött (pl. zárva tartás, ünnepi nyitvatartás). Üresen hagyva nem látszik.</p>
          <label htmlFor="s-notice" className="sr-only">
            Közlemény szövege
          </label>
          <textarea id="s-notice" rows={2} maxLength={400} value={notice} disabled={!loaded} onChange={(e) => setNotice(e.target.value)} className={`${inputCls} mt-3`} placeholder="pl. Karácsonyi szünet: december 24–január 2. között zárva." />
        </section>

        <button type="submit" className={btnPrimary} disabled={saving || !loaded}>
          {saving ? "Mentés…" : "Beállítások mentése"}
        </button>
      </form>

      <form onSubmit={changePassword} className="rounded-[10px] border border-[#dedbd3] bg-white p-5">
        <h2 className="font-sans text-[16px] font-semibold">Jelszó megváltoztatása</h2>
        <p className="mt-1 text-[13.5px] text-[#666]">Legalább 8 karakter. Az első belépés után érdemes lecserélni az átadáskor kapott jelszót.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pw-current" className={labelCls}>
              Jelenlegi jelszó
            </label>
            <input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label htmlFor="pw-next" className={labelCls}>
              Új jelszó
            </label>
            <input id="pw-next" type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} required />
          </div>
        </div>
        <button type="submit" className={`${btnPrimary} mt-4`} disabled={pwBusy}>
          {pwBusy ? "Mentés…" : "Jelszó cseréje"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#dedbd3] bg-white p-5">
        <div className="mr-auto">
          <h2 className="font-sans text-[16px] font-semibold">Munkamenet</h2>
          <p className="mt-1 text-[13.5px] text-[#666]">Közös gépen lépjen ki, ha végzett.</p>
        </div>
        <button type="button" className={btnGhost} onClick={closeWindow}>
          Ablak bezárása
        </button>
        <button type="button" className={btnDanger} onClick={signOut}>
          Kijelentkezés
        </button>
      </div>
    </div>
  );
}
