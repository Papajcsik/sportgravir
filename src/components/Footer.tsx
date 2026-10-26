import Link from "next/link";
import { infoNav, legalNav, site } from "@/lib/site";
import type { NavItem } from "./Header";
import Logo from "./Logo";

const heading = "display text-[22px] leading-none text-gold";
const link = "underline-offset-4 hover:text-white hover:underline";

export default function Footer({ nav }: { nav: NavItem[] }) {
  return (
    <footer className="on-dark rings-dark relative mt-24 overflow-hidden bg-pine pb-8 text-mist">
      <div className="board-edge" aria-hidden="true" />
      <div className="wrap pt-14">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" aria-label="Sport Gravír – kezdőlap" className="inline-block">
              <Logo light />
            </Link>
            <p className="mt-5 max-w-[360px] text-[16px] leading-7">Családi vállalkozásunk 1990 óta áll a vásárlók rendelkezésére: serlegek, érmek, plakettek, sportdíjak és ajándéktárgyak raktárról, azonnali gravírozással, helyben megvárható.</p>
            <p className="mt-5 text-[16px] leading-7">
              {site.address}
              <br />
              {site.phones.map((p) => (
                <span key={p.num} className="mr-4 inline-block">
                  <a href={p.href} className="text-[18px] font-bold text-white underline-offset-4 hover:underline">
                    {p.num}
                  </a>
                </span>
              ))}
              <br />
              <a href={`mailto:${site.email}`} className={link}>
                {site.email}
              </a>
            </p>
          </div>

          <nav aria-label="Termékkategóriák a láblécben">
            <h2 className={heading}>Termékeink</h2>
            <ul className="mt-4 space-y-2 text-[16px]">
              {nav.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className={link}>
                    {t.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/gravirozas" className={link}>
                  Feliratozás, gravírozás
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Információk">
            <h2 className={heading}>Információk</h2>
            <ul className="mt-4 space-y-2 text-[16px]">
              {infoNav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className={link}>
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/rendeles" className={link}>
                  Rendelés
                </Link>
              </li>
              {legalNav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={link}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={heading}>Nyitvatartás</h2>
            <dl className="mt-4 text-[16px]">
              {site.hours.map(([d, h]) => (
                <div key={d} className="flex justify-between gap-4 border-b border-mist/20 pb-1.5 pt-1.5">
                  <dt>{d}</dt>
                  <dd className="font-bold text-white">{h}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[15px] leading-6">
              <a href={site.facebook} target="_blank" rel="noopener noreferrer" className={link}>
                Facebook<span className="sr-only"> (új lapon nyílik)</span>
              </a>
              {" · "}
              <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className={link}>
                Térkép<span className="sr-only"> (új lapon nyílik)</span>
              </a>
            </p>
          </div>
        </div>

        <p className="mt-12 border-t border-white/15 pt-6 text-[14.5px] leading-6">
          © 2011–{new Date().getFullYear()} {site.name} · Az árakat az árlistában találod; a webáruházban nincs online fizetés. Ez egy bemutató változat: a rendelések nem mennek ki e-mailben.
        </p>
      </div>
    </footer>
  );
}
