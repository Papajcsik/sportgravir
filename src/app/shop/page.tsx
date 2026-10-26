import type { Metadata } from "next";
import Listing from "@/components/Listing";
import { rootCategories } from "@/lib/categories";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  return {
    title: "Termékeink – serlegek, érmek, plakettek, sportdíjak",
    description: "Serlegek, érmek, érembetétek, sportfigurák, plakettek, üvegdíjak, dísztányérok, dobozok, oklevelek és bélyegzők raktárról, gravírozással. Rendelj online.",
    alternates: { canonical: "/shop" },
    robots: Object.keys(sp).length ? { index: false, follow: true } : undefined,
  };
}

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Listing
      base="/shop"
      title="Termékeink"
      eyebrow="Serlegbolt, érembolt"
      lead="Válassz kategóriát, tedd a rendelési listába, amit rendelnél, és írd meg a gravírozandó szöveget. Egyedi érmet, jelvényt, cégtáblát is készítünk."
      crumbs={[{ href: "/shop", label: "Termékeink" }]}
      searchParams={await searchParams}
      tiles={rootCategories}
    />
  );
}
