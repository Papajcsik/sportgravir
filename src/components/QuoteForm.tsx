"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "./CartContext";

const lab = "mb-1.5 block text-[16px] font-bold text-ink";

/**
 * The order form. In "order" mode it lists the order list (quantity and the text to engrave per item) above the contact data;
 * in "contact" mode it is a plain message form.
 */
export default function QuoteForm({ mode = "order" }: { mode?: "order" | "contact" }) {
  const { lines, setQty, setEngrave, removeItem, clear, ready } = useCart();
  const [state, setState] = useState<{ kind: "idle" | "sending" | "sent" | "error"; text?: string }>({ kind: "idle" });
  const doneRef = useRef<HTMLHeadingElement>(null);
  const order = mode === "order";
  const empty = order && ready && lines.length === 0;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    const f = new FormData(e.currentTarget);
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: order ? "ajanlat" : "kapcsolat",
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone"),
          message: f.get("message"),
          website: f.get("website"),
          consent: f.get("consent") === "on",
          lines: order ? lines.map((l) => ({ id: l.id, qty: l.qty, engrave: l.engrave ?? "" })) : [],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { number?: string; error?: string };
      if (!res.ok || !data.number) {
        setState({ kind: "error", text: data.error ?? "Az üzenetet most nem sikerült elküldeni. Hívj minket, vagy próbáld újra később." });
        return;
      }
      if (order) clear();
      setState({ kind: "sent", text: data.number });
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch {
      setState({ kind: "error", text: "Nincs kapcsolat a szerverrel. Próbáld újra egy kicsit később." });
    }
  };

  if (state.kind === "sent")
    return (
      <div role="status" className="rounded-lg border border-line bg-[#e8edf5] p-7 shadow-card">
        <h2 ref={doneRef} tabIndex={-1} className="display text-[30px] leading-tight outline-none">
          {order ? "Megkaptuk a rendelésedet" : "Megkaptuk az üzenetedet"}
        </h2>
        <p className="mt-3 text-[17px] leading-7 text-ink">
          Az azonosító: <strong>{state.text}</strong>. {order ? "A gravírozásról látványtervet küldünk e-mailben, és csak az elfogadás után kezdjük el a gyártást." : "Hamarosan válaszolunk."} Ez a bemutató változat: valódi e-mail nem megy ki.
        </p>
        <Link href="/shop" className="btn-outline mt-5">
          Tovább a termékekhez
        </Link>
      </div>
    );

  return (
    <div className={order ? "grid gap-10 lg:grid-cols-[1fr_440px]" : ""}>
      {order && (
        <section aria-label="A rendelési lista tartalma">
          {!ready ? (
            <p className="py-10 text-[17px] text-ink-2" aria-busy="true">
              Betöltés…
            </p>
          ) : empty ? (
            <div className="max-w-[520px] py-6" role="status">
              <p className="display t-3">A rendelési lista üres</p>
              <p className="mt-3 text-[17.5px] leading-8">A termékeknél a „Rendelési listához adom” gombbal gyűjtheted össze, amit rendelnél. Ha pontosan tudod, mi kell, a lenti űrlapon közvetlenül is megírhatod.</p>
              <Link href="/shop" className="btn-red mt-6">
                Termékeink
              </Link>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-line border-y border-line">
                {lines.map((l) => (
                  <li key={l.key} className="grid grid-cols-[84px_1fr] gap-x-4 gap-y-2 py-4 sm:grid-cols-[96px_1fr_auto]">
                    <Link href={`/termek/${l.slug}`} className="cover relative block h-[76px] overflow-hidden sm:h-[84px]" tabIndex={-1} aria-hidden="true">
                      <Image src={l.image} alt="" fill sizes="96px" className="object-contain p-1" />
                    </Link>
                    <div className="min-w-0">
                      <h3 className="display text-[21px] leading-tight">
                        <Link href={`/termek/${l.slug}`} className="hover:text-berry">
                          {l.name}
                        </Link>
                      </h3>
                      <label htmlFor={`eng-${l.key}`} className="mt-2 block text-[14.5px] font-bold text-ink">
                        Gravírozandó szöveg
                      </label>
                      <input id={`eng-${l.key}`} value={l.engrave ?? ""} maxLength={300} onChange={(e) => setEngrave(l.key, e.target.value)} className="field !py-[8px] !text-[16px]" placeholder="pl. Kiss Péter – 1. helyezett, 2026" />
                      <button type="button" className="mt-2 text-[15px] font-semibold underline underline-offset-2 hover:text-berry" onClick={() => removeItem(l.key)}>
                        Eltávolítás<span className="sr-only">: {l.name}</span>
                      </button>
                    </div>
                    <div className="col-span-2 flex h-11 items-stretch justify-self-start rounded-md border border-line bg-white sm:col-span-1 sm:justify-self-end" role="group" aria-label={`Darabszám: ${l.name}`}>
                      <button type="button" className="w-10 text-xl font-bold leading-none hover:bg-paper" onClick={() => setQty(l.key, l.qty - 1)} aria-label={`${l.name} darabszámának csökkentése`}>
                        −
                      </button>
                      <span className="flex w-14 items-center justify-center border-x border-line text-[17px] font-bold tabular-nums" aria-live="polite">
                        {l.qty}
                      </span>
                      <button type="button" className="w-10 text-xl font-bold leading-none hover:bg-paper" onClick={() => setQty(l.key, l.qty + 1)} aria-label={`${l.name} darabszámának növelése`}>
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[15.5px] leading-6 text-ink-2">A gravírozásról látványtervet készítünk, azt e-mailben elküldjük, és csak az elfogadás után kezdjük el a gyártást. Az árakat az <Link href="/arlista" className="font-bold underline underline-offset-2">árlistában</Link> találod.</p>
            </>
          )}
        </section>
      )}

      <form onSubmit={onSubmit} className="h-fit space-y-5 rounded-lg border border-line bg-cream p-6 shadow-card sm:p-7" aria-label={order ? "Rendelés" : "Üzenet"}>
        <h2 className="display text-[28px] leading-none">{order ? "Az adataid" : "Küldj üzenetet!"}</h2>
        <div>
          <label htmlFor="q-name" className={lab}>
            Az Ön neve *
          </label>
          <input id="q-name" name="name" required autoComplete="name" className="field" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="q-phone" className={lab}>
              Telefonszáma *
            </label>
            <input id="q-phone" name="phone" type="tel" required autoComplete="tel" className="field" />
          </div>
          <div>
            <label htmlFor="q-email" className={lab}>
              E-mail címe *
            </label>
            <input id="q-email" name="email" type="email" required autoComplete="email" className="field" />
          </div>
        </div>
        <div>
          <label htmlFor="q-msg" className={lab}>
            {order ? "Kérdése, üzenete, határidő" : "Kérdése, üzenete *"}
          </label>
          <textarea id="q-msg" name="message" rows={4} required={!order} minLength={order ? 0 : 5} className="field" placeholder={order ? "pl. kell-e doboz, mikorra szeretné" : "pl. 40 db érem kellene, gravírozással"} />
        </div>
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label>
            Ne töltsd ki
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-[15.5px] leading-6">
          <input type="checkbox" name="consent" required className="mt-1 size-5 shrink-0 accent-[#8a1f2b]" />
          <span>Hozzájárulok, hogy a megadott adataimmal {order ? "a rendelés" : "az üzenetem"} ügyében felvegyék velem a kapcsolatot. *</span>
        </label>
        {state.kind === "error" && (
          <p role="alert" className="rounded-md border border-[#8f2417] bg-[#fdecea] p-4 text-[16px] leading-6 text-[#7a1f14]">
            {state.text}
          </p>
        )}
        <button type="submit" className="btn-red w-full !py-[13px] !text-[18px]" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? "Küldés…" : "Küldés"}
        </button>
      </form>
    </div>
  );
}
