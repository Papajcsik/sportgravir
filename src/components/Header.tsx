"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { infoNav, site } from "@/lib/site";
import { useCart } from "./CartContext";
import Logo from "./Logo";
import MiniCart from "./MiniCart";

/** One top category of the product menu: its sub-categories (each with its own sub-categories) and a photo. Built on the server (layout). */
export type NavItem = { href: string; label: string; color: string; n?: number; /** a few products of the category */ items?: { href: string; name: string; src: string; w: number; h: number }[]; cols: { href: string; title: string; n?: number; kids: { href: string; title: string }[] }[]; /** a photo shown in the panel */ pic?: { href: string; src: string; w: number; h: number; name: string } };

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.8-4.8" />
  </svg>
);

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 4.2l4 4 4-4" />
  </svg>
);

/** Three boards of different length: the mark of the product menu button. */
const BoardsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M3 6h18M3 12h13M3 18h18" />
  </svg>
);

/**
 * Fixed header: a thin info strip, then one row with the logo, the product menu button (a two-pane mega menu: categories on the left, the chosen one with its photo and sub-categories on the right), the page links, search and the quote basket (wide screens).
 * It slides away while scrolling down and returns as soon as you scroll up or add something to the cart (which also pops the mini cart open).
 */
export default function Header({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname; // navigating to another page closes the menu
  const [hidden, setHidden] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // mini cart: opens after an add (auto-closes) or on click
  const [cartPath, setCartPath] = useState<string | null>(null);
  const [cartAuto, setCartAuto] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const cartOpen = cartPath === pathname && totalCount > 0;
  const openRef = useRef(false);
  // product mega menu (wide screens)
  const [megaPath, setMegaPath] = useState<string | null>(null);
  const mega = megaPath === pathname;
  const [active, setActive] = useState(0);
  const megaButtonRef = useRef<HTMLButtonElement>(null);
  const megaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerKind = useRef("mouse");
  const showMega = () => {
    clearTimeout(megaTimer.current);
    setCartPath(null);
    setMegaPath(pathname);
  };
  const hideMega = () => {
    clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setMegaPath(null), 220);
  };

  useEffect(() => {
    openRef.current = open || cartOpen || mega;
  }, [open, cartOpen, mega]);

  // hide on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = Math.max(0, window.scrollY);
      const dy = y - lastY;
      if (y < 100 || openRef.current) setHidden(false);
      else if (dy > 6) setHidden(true);
      else if (dy < -6) setHidden(false);
      if (Math.abs(dy) > 6 || y < 100) lastY = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // an add brings the header back and pops the mini cart open for a few seconds
  useEffect(() => {
    const onAdd = () => {
      setHidden(false);
      setOpenPath(null);
      setCartPath(window.location.pathname);
      setCartAuto(true);
    };
    window.addEventListener("sportgravir:cart-add", onAdd);
    return () => window.removeEventListener("sportgravir:cart-add", onAdd);
  }, []);

  useEffect(() => {
    if (!cartOpen || !cartAuto || engaged) return;
    const t = setTimeout(() => setCartPath(null), 4500);
    return () => clearTimeout(t);
  }, [cartOpen, cartAuto, engaged]);

  // click outside closes the mini cart
  useEffect(() => {
    if (!cartOpen) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t && !t.closest("[data-cart-zone]")) setCartPath(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [cartOpen]);

  // click outside closes the product menu
  useEffect(() => {
    if (!mega) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t && !t.closest("[data-mega-zone]")) setMegaPath(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [mega]);

  // Escape closes the menu / mini cart
  useEffect(() => {
    if (!open && !cartOpen && !mega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (cartOpen) {
        setCartPath(null);
        document.querySelector<HTMLElement>("[data-cart-zone] button[aria-controls=mini-cart]")?.focus();
      } else if (mega) {
        setMegaPath(null);
        megaButtonRef.current?.focus();
      } else {
        setOpenPath(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, cartOpen, mega]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const offscreen = hidden && !open && !cartOpen && !mega;

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-ink/60 transition-opacity duration-300 xl:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpenPath(null)} aria-hidden="true" />
      <header
        onFocusCapture={() => setHidden(false)}
        className={`fixed inset-x-0 top-0 z-50 border-b border-line bg-cream transition-[translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${offscreen ? "-translate-y-full" : "translate-y-0"}`}
      >
        {/* info strip (wide screens) */}
        <div className="hidden bg-pine text-mist xl:block">
          <div className="wrap flex h-[34px] items-center justify-between text-[14px]">
            <p>
              <span className="font-bold text-cream">Serlegbolt, érembolt</span> · azonnali gravírozás helyben · 1148 Budapest, Kerepesi út 40.
            </p>
            <ul className="flex items-center gap-5">
              <li>H–P 8–16</li>
              <li>
                <a href={site.phoneHref} className="hover:text-white">
                  {site.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-white">
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="wrap relative flex h-[72px] items-center justify-between gap-4 xl:h-[80px] xl:gap-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Sport Gravír – főoldal">
            <Logo />
          </Link>

          {/* product menu button; the panel hangs under the whole row */}
          <div data-mega-zone className="hidden self-stretch xl:flex xl:items-center" onPointerEnter={(e) => e.pointerType === "mouse" && showMega()} onPointerLeave={(e) => e.pointerType === "mouse" && hideMega()} onBlur={(e) => e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node) && setMegaPath(null)}>
            <button
              ref={megaButtonRef}
              type="button"
              aria-expanded={mega}
              aria-controls="mega-menu"
              onClick={() => (mega ? setMegaPath(null) : showMega())}
              className={`flex h-11 items-center gap-2.5 rounded-md px-5 text-[16.5px] font-bold text-ink shadow-card transition-colors ${mega ? "bg-pine !text-white" : "bg-gold hover:brightness-105"}`}
            >
              <BoardsIcon />
              Termékeink
              <Chevron className={`transition-transform duration-200 ${mega ? "rotate-180" : ""}`} />
            </button>

            <div
              id="mega-menu"
              inert={!mega}
              className={`absolute inset-x-0 top-full z-30 overflow-hidden rounded-b-xl border border-t-0 border-line bg-cream shadow-lift transition-[opacity,translate,visibility] duration-200 ${mega ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}
              style={{ borderBottom: "4px solid var(--gold)" }}
            >
              <div className="grid max-h-[calc(100dvh-130px)] grid-cols-[330px_minmax(0,1fr)]">
                <nav aria-label="Termékkategóriák" className="on-dark overflow-y-auto bg-pine py-3">
                  <ul>
                    {nav.map((t, i) => (
                      <li key={t.href}>
                        <Link
                          href={t.href}
                          onPointerDown={(e) => (pointerKind.current = e.pointerType)}
                          onMouseEnter={() => setActive(i)}
                          onFocus={() => setActive(i)}
                          onClick={(e) => {
                            if (pointerKind.current === "touch" && active !== i) {
                              e.preventDefault();
                              setActive(i);
                            }
                          }}
                          aria-current={isActive(t.href) ? "page" : undefined}
                          className={`flex items-center gap-3 border-l-4 py-2 pl-4 pr-4 text-[16px] font-semibold leading-snug transition-colors ${active === i ? "border-gold bg-cream text-ink" : "border-transparent text-mist hover:text-white"}`}
                        >
                          {t.pic ? <Image src={t.pic.src} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full border border-gold/60 object-cover" /> : <span className="size-9 shrink-0 rounded-full border border-gold/60" aria-hidden="true" />}
                          <span className="min-w-0 flex-1">{t.label}</span>
                          {t.n ? <span className={`text-[13px] tabular-nums ${active === i ? "text-ink-2" : "text-mist/70"}`}>{t.n}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop" className="mx-4 mt-3 flex items-center justify-between border-t border-white/15 pt-3 text-[15.5px] font-bold text-gold hover:text-white">
                    Összes termék
                    <span aria-hidden="true">→</span>
                  </Link>
                </nav>

                {nav[active] && (
                  <div className="rings-pane relative min-h-[470px] p-8 pr-10">
                    <div className={`grid gap-9 ${nav[active].pic ? "grid-cols-[minmax(0,1fr)_270px]" : "grid-cols-1"}`}>
                      <div>
                        <p className="kicker mb-3">Kategória{nav[active].n ? ` · ${nav[active].n} termék` : ""}</p>
                        <Link href={nav[active].href} className="display block text-[36px] leading-[1.08] text-ink hover:text-berry">
                          {nav[active].label}
                        </Link>
                        {nav[active].cols.length > 0 ? (
                          <ul className="mt-6 grid grid-cols-2 gap-x-9 gap-y-6">
                            {nav[active].cols.map((k) => (
                              <li key={k.href}>
                                <Link href={k.href} className="display flex items-baseline justify-between gap-3 border-b border-line pb-1.5 text-[20px] leading-tight text-ink hover:text-berry">
                                  {k.title}
                                  {k.n ? <span className="font-[family-name:var(--font-sans)] text-[13px] font-semibold text-ink-2">{k.n}</span> : null}
                                </Link>
                                {k.kids.length > 0 && (
                                  <ul className="mt-2 space-y-1 text-[15.5px]">
                                    {k.kids.map((g) => (
                                      <li key={g.href}>
                                        <Link href={g.href} className="text-ink-2 hover:text-berry hover:underline">
                                          {g.title}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-5 max-w-[420px] text-[17px] leading-8 text-ink-2">Ebben a kategóriában egy listán találod az összes terméket, méret és változat szerint.</p>
                        )}
                        {(nav[active].items?.length ?? 0) > 0 && (
                          <div className="mt-8">
                            <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-gold-dark">Népszerű termékek</p>
                            <ul className="grid grid-cols-3 gap-4">
                              {nav[active].items?.map((it) => (
                                <li key={it.href}>
                                  <Link href={it.href} className="group/i flex flex-col gap-2 rounded-md border border-line bg-white p-2 shadow-card transition-shadow hover:shadow-lift">
                                    <Image src={it.src} alt="" width={it.w} height={it.h} sizes="150px" className="aspect-square w-full rounded-sm bg-white object-contain" />
                                    <span className="line-clamp-2 px-0.5 text-[14.5px] font-semibold leading-snug text-ink group-hover/i:text-berry">{it.name}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Link href={nav[active].href} className="btn-red mt-7">
                          Mind megtekintése
                        </Link>
                      </div>
                      {nav[active].pic && (
                        <Link href={nav[active].pic.href} tabIndex={-1} aria-hidden="true" className="group/p block self-start rounded-md border border-line bg-white p-2 shadow-card">
                          <Image src={nav[active].pic.src} alt="" width={nav[active].pic.w} height={nav[active].pic.h} sizes="270px" className="aspect-[4/5] w-full rounded-sm object-cover" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <nav aria-label="Oldalak" className="hidden xl:block">
            <ul className="flex items-center">
              {infoNav.slice(1).map((n, i) => (
                <li key={n.href} className={i === 0 || i === 3 ? "hidden 2xl:block" : ""}>
                  <Link href={n.href} className="top-link" aria-current={isActive(n.href) ? "page" : undefined}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <form action="/kereses" role="search" className="relative ml-auto hidden w-full max-w-[330px] xl:block">
            <label htmlFor="site-search" className="sr-only">
              Keresés a termékek között
            </label>
            <input id="site-search" name="q" type="search" autoComplete="off" placeholder="Keresés: serleg, kód…" className="field !rounded-lg !py-[10px] !pl-4 !pr-14" />
            <button type="submit" className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-[6px] bg-berry text-white hover:bg-pine" aria-label="Keresés">
              <SearchIcon />
            </button>
          </form>

          <div className="flex items-center justify-end gap-1 xl:gap-3">
            <div data-cart-zone onPointerDown={() => setCartAuto(false)} onMouseEnter={() => setEngaged(true)} onMouseLeave={() => setEngaged(false)} onFocusCapture={() => setEngaged(true)} onBlurCapture={() => setEngaged(false)}>
              <MiniCart
                open={cartOpen}
                onToggle={() => {
                  setOpenPath(null);
                  setMegaPath(null);
                  setCartAuto(false);
                  setCartPath(cartOpen ? null : pathname);
                }}
                onClose={() => setCartPath(null)}
              />
            </div>

            <button
              ref={buttonRef}
              type="button"
              className="group relative size-11 text-ink xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => {
                setCartPath(null);
                setOpenPath(open ? null : pathname);
              }}
            >
              <span className="sr-only">{open ? "Menü bezárása" : "Menü megnyitása"}</span>
              <span aria-hidden="true" className="absolute left-1/2 top-1/2 block h-[20px] w-[28px] -translate-x-1/2 -translate-y-1/2">
                <span className={`absolute left-0 h-[3px] w-full rounded-[1px] bg-current transition-all duration-300 ease-out ${open ? "top-[8.5px] rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 top-[8.5px] h-[3px] rounded-[1px] bg-current transition-all duration-300 ease-out ${open ? "w-0 opacity-0" : "w-[20px] opacity-100 group-hover:w-full"}`} />
                <span className={`absolute left-0 h-[3px] w-full rounded-[1px] bg-current transition-all duration-300 ease-out ${open ? "top-[8.5px] -rotate-45" : "top-[17px]"}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu: only built while it is open */}
        {open && (
          <div id="mobile-menu" className="absolute inset-x-0 top-full max-h-[calc(100dvh-72px)] overflow-y-auto border-b border-line bg-cream xl:hidden">
            <form action="/kereses" role="search" className="wrap relative pt-3">
              <label htmlFor="mobile-search" className="sr-only">
                Keresés a termékek között
              </label>
              <input id="mobile-search" name="q" type="search" autoComplete="off" placeholder="Keresés: serleg, érem, kód…" className="field !pr-14" />
              <button type="submit" className="absolute right-[24px] top-[17px] flex size-10 items-center justify-center rounded-[4px] bg-berry text-white md:right-[40px]" aria-label="Keresés">
                <SearchIcon />
              </button>
            </form>
            <nav aria-label="Mobil menü">
              <ul className="wrap pb-2 pt-2">
                {nav.map((t) => (
                  <li key={t.label} className="border-b border-line">
                    {t.cols.length ? (
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[18px] font-bold text-ink">
                          <span className="flex items-center gap-2.5">
                            <i aria-hidden="true" className="size-3 rounded-full border border-line" style={{ background: t.color }} />
                            {t.label}
                          </span>
                          <span aria-hidden="true" className="text-[24px] leading-none transition-transform group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <ul className="pb-3 pl-5">
                          <li>
                            <Link href={t.href} className="block py-2 text-[17px] font-bold text-berry">
                              Mind a(z) {t.label.toLowerCase()}
                            </Link>
                          </li>
                          {t.cols.map((k) => (
                            <li key={k.href}>
                              <Link href={k.href} className="block py-2 text-[17px] font-semibold text-ink">
                                {k.title}
                              </Link>
                              {k.kids.map((g) => (
                                <Link key={g.href} href={g.href} className="block py-1.5 pl-4 text-[16px] text-ink-2">
                                  – {g.title}
                                </Link>
                              ))}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <Link href={t.href} className="flex items-center gap-2.5 py-3.5 text-[18px] font-bold text-ink" aria-current={isActive(t.href) ? "page" : undefined}>
                        <i aria-hidden="true" className="size-3 rounded-full border border-line" style={{ background: t.color }} />
                        {t.label}
                      </Link>
                    )}
                  </li>
                ))}
                {infoNav.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="nav-link !px-0 !py-3 !text-[16.5px]" aria-current={isActive(n.href) ? "page" : undefined}>
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="wrap pb-5 pt-1 text-[15.5px]">
              <a href={site.phoneHref} className="text-[21px] font-bold text-ink">
                {site.phone}
              </a>
              <span className="block text-ink-2">Hétfő–péntek 7–17, szombat 7–13 · szállítás 15 tonnáig</span>
            </p>
          </div>
        )}
      </header>
    </>
  );
}
