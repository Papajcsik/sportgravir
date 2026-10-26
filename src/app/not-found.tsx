import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Az oldal nem található", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div className="wrap py-20">
      <p className="display text-[clamp(70px,12vw,150px)] leading-none text-gold-dark" aria-hidden="true">
        404
      </p>
      <h1 className="display t-1 mt-2">Ez a serleg nem a polcon van</h1>
      <p className="mt-5 max-w-[620px] text-[18px] leading-8">
        Az oldal áthelyezésre került, vagy a termék már nem kapható. Nézd meg a kategóriákat, keress kód szerint, vagy hívj minket: {site.phone}.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-outline">
          Főoldal
        </Link>
        <Link href="/shop" className="btn-red">
          Termékeink
        </Link>
      </div>
    </div>
  );
}
