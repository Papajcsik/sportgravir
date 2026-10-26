import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageTitle from "@/components/PageTitle";
import { getPages } from "@/lib/store";

export const metadata: Metadata = {
  title: "Hasznos információk, ötletek – érem, serleg, gravírozás",
  description: "Cikkeink az érem készítésről, a serlegekről, a lézer- és mechanikus gravírozásról, plakettekről és egyedi ajándékokról.",
  alternates: { canonical: "/hasznos-informaciok" },
};

const text = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export default async function Articles() {
  const arts = (await getPages()).filter((p) => p.kind === "article");
  return (
    <div className="pb-8">
      <PageTitle eyebrow="Szabadi Sport Gravír" lead="Ötletek, tudnivalók és útmutatók díjazáshoz, gravírozáshoz és ajándékozáshoz.">
        Hasznos információk, ötletek
      </PageTitle>
      <div className="wrap pt-6">
        <Breadcrumbs items={[{ href: "/hasznos-informaciok", label: "Hasznos információk" }]} />
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {arts.map((a) => {
            const img = /<img src="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"/.exec(a.html);
            const body = text(a.html).slice(0, 280);
            return (
              <li key={a.id}>
                <article className="flex h-full gap-4 rounded-lg border border-line bg-white p-4 shadow-card">
                  {img && <Image src={img[1]} alt="" width={Number(img[2])} height={Number(img[3])} sizes="140px" className="hidden h-[100px] w-[140px] shrink-0 rounded-md border border-line object-cover sm:block" />}
                  <div className="min-w-0">
                    <h2 className="display text-[21px] leading-snug">
                      <Link href={`/${a.path}`} className="hover:text-berry">
                        {a.title}
                      </Link>
                    </h2>
                    {a.date && <p className="mt-1 text-[13.5px] font-semibold text-ink-2">{a.date}</p>}
                    <p className="mt-2 line-clamp-3 text-[15.5px] leading-6 text-ink-2">{body}</p>
                    <p className="mt-2">
                      <Link href={`/${a.path}`} className="text-[14.5px] font-bold text-berry underline underline-offset-4">
                        Bővebben<span className="sr-only">: {a.title}</span>
                      </Link>
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
