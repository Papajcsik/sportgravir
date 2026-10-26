import type { Metadata } from "next";
import Listing from "@/components/Listing";
import { parseQuery } from "@/lib/catalog";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = parseQuery(sp);
  return {
    title: q.q ? `Keresés: ${q.q}` : "Keresés a termékek között",
    description: "Keress a Sport Gravír termékei között: serlegek, érmek, plakettek, sportfigurák, kód szerint is.",
    alternates: { canonical: "/kereses" },
    robots: q.q || Object.keys(sp).length ? { index: false, follow: true } : undefined,
  };
}

export default async function Search({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = parseQuery(sp);
  return (
    <Listing
      base="/kereses"
      title={q.q ? `Keresés: „${q.q}”` : "Keresés"}
      eyebrow="Termékeink"
      lead="Írd be a termék nevét vagy a kódját (pl. E15, 111)."
      crumbs={[{ href: "/kereses", label: q.q ? `Keresés: ${q.q}` : "Keresés" }]}
      searchParams={sp}
    />
  );
}
