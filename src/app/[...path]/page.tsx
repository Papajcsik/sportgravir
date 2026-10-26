import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PageEditButton } from "@/components/EditButton";
import Gallery from "@/components/Gallery";
import Listing from "@/components/Listing";
import PageTitle from "@/components/PageTitle";
import ProductPage from "@/components/ProductPage";
import QuoteForm from "@/components/QuoteForm";
import { catByPath, crumbsOf } from "@/lib/categories";
import { site } from "@/lib/site";
import { getDetails, getPageByPath, getProductBySlug } from "@/lib/store";

type SP = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ path: string[] }>; searchParams: Promise<SP> };

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…` : s);
const plain = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const hasParams = (sp: SP) => Object.keys(sp).length > 0;
const pathOf = async (params: Props["params"]) => (await params).path.map(decodeURIComponent);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const path = await pathOf(params);
  const joined = path.join("/");
  const sp = await searchParams;
  const robots = hasParams(sp) ? { index: false, follow: true } : undefined;

  const cat = catByPath(joined);
  if (cat) {
    const intro = cat.html ? plain(cat.html) : "";
    return {
      title: clip(cat.h1, 62),
      description: clip(intro.length > 60 ? intro : `${cat.title}: a Szabadi Sport Gravír serlegboltjának kínálata raktárról, azonnali gravírozással. Budapest, Kerepesi út 40.`, 158),
      alternates: { canonical: `/${cat.path}` },
      robots,
    };
  }
  if (path.length === 2 && path[0] === "termek") {
    const p = await getProductBySlug(path[1]);
    if (p && p.visible) {
      return {
        title: clip(p.name, 62),
        description: `${p.name}: raktárról, azonnali gravírozással a budapesti serlegboltból. Rendeld online, vagy gyere el a Kerepesi útra.`,
        alternates: { canonical: `/termek/${p.slug}` },
        openGraph: { images: [{ url: p.image }] },
      };
    }
  }
  const page = await getPageByPath(joined);
  if (page) {
    const text = plain(page.html);
    return { title: clip(page.title, 62), description: clip(text.length > 60 ? text : `${page.title} – Szabadi Sport Gravír serlegbolt, Budapest.`, 158), alternates: { canonical: `/${page.path}` } };
  }
  return {};
}

export default async function CatchAll({ params, searchParams }: Props) {
  const path = await pathOf(params);
  const joined = path.join("/");
  const sp = await searchParams;

  const cat = catByPath(joined);
  if (cat) {
    if (cat.path !== joined) permanentRedirect(`/${cat.path}`); // one canonical spelling
    const chain = crumbsOf(cat.path);
    const crumbs = [{ href: "/shop", label: "Termékeink" }, ...chain.map((c) => ({ href: `/${c.path}`, label: c.title }))];
    const parent = chain.length > 1 ? chain[chain.length - 2].title : "Termékeink";
    return <Listing base={`/${cat.path}`} title={cat.h1} eyebrow={parent} path={cat.path} crumbs={crumbs} searchParams={sp} tilesOf={cat.path} html={cat.html} />;
  }

  if (path.length === 2 && path[0] === "termek") {
    const p = await getProductBySlug(path[1]);
    if (p && p.visible) {
      if (p.slug !== path[1]) permanentRedirect(`/termek/${p.slug}`);
      return <ProductPage p={p} details={await getDetails(p.id)} />;
    }
  }

  const page = await getPageByPath(joined);
  if (!page) notFound();

  const isContact = page.path === "kapcsolat";
  const parentPath = path.length > 1 ? path.slice(0, -1).join("/") : "";
  const parentPage = parentPath ? await getPageByPath(parentPath) : undefined;
  const crumbs = [
    ...(page.kind === "article" ? [{ href: "/hasznos-informaciok", label: "Hasznos információk" }] : parentPage ? [{ href: `/${parentPage.path}`, label: parentPage.title }] : []),
    { href: `/${page.path}`, label: page.title },
  ];

  return (
    <div className="pb-8">
      <PageTitle eyebrow={page.kind === "article" ? "Hasznos információk, ötletek" : "Szabadi Sport Gravír"} lead={undefined}>
        {page.title}
      </PageTitle>
      <div className="wrap pt-6">
        <Breadcrumbs items={crumbs} />
        <PageEditButton id={page.id} className="mt-4" />

        {isContact ? (
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-6 text-[17.5px] leading-8">
              <div>
                <h2 className="display text-[28px] leading-tight">{site.name}</h2>
                <p className="mt-2">
                  Címünk:{" "}
                  <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-berry underline underline-offset-2">
                    {site.address}
                    <span className="sr-only"> (új lapon nyílik)</span>
                  </a>
                </p>
                <ul className="mt-1">
                  <li>
                    Telefon:{" "}
                    <a href="tel:+3614221778" className="font-bold text-ink">
                      {site.phones[0].num}
                    </a>
                  </li>
                  <li>Fax: {site.fax}</li>
                  {site.phones.slice(1).map((p) => (
                    <li key={p.num}>
                      Mobil:{" "}
                      <a href={p.href} className="font-bold text-ink">
                        {p.num}
                      </a>
                    </li>
                  ))}
                  <li>
                    E-mail:{" "}
                    <a href={`mailto:${site.email}`} className="font-bold text-berry underline underline-offset-2">
                      {site.email}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="display text-[24px] leading-tight">Nyitva tartás</h2>
                <dl className="mt-2 max-w-[340px]">
                  {site.hours.map(([d, h]) => (
                    <div key={d} className="flex justify-between gap-4 border-b border-line py-1">
                      <dt>{d}</dt>
                      <dd className="font-bold text-ink">{h}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <iframe
                title="Térkép: Budapest, Kerepesi út 40."
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3811.896021005038!2d19.111330893370422!3d47.50125945242443!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741dc98783dd8df%3A0x3829686cd819c8ef!2sBudapest%2C+Kerepesi+%C3%BAt+40%2C+1148!5e0!3m2!1shu!2shu"
                loading="lazy"
                className="h-[320px] w-full rounded-md border border-line"
              />
            </div>
            <QuoteForm mode="contact" />
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {page.kind === "article" && page.date && <p className="text-[15px] font-semibold text-ink-2">Megjelent: {page.date}</p>}
            {page.html && <div className="wp" dangerouslySetInnerHTML={{ __html: page.html }} />}
            {page.gallery && page.gallery.length > 0 && <Gallery images={page.gallery} label={`${page.title}: fotók`} />}
            {page.kind === "article" && (
              <p className="pt-2">
                <Link href="/hasznos-informaciok" className="btn-outline">
                  További cikkek
                </Link>{" "}
                <Link href="/shop" className="btn-red">
                  Termékeink
                </Link>
              </p>
            )}
          </div>
        )}
        {!isContact && page.kind === "page" && (
          <aside className="rings relative mt-14 overflow-hidden rounded-lg border border-line bg-paper px-7 py-8 sm:px-10" aria-label="Kapcsolat">
            <h2 className="display text-[28px] leading-tight">Segítünk a választásban</h2>
            <p className="mt-2 max-w-[560px] text-[16.5px] leading-7">Keress minket telefonon vagy az üzletben: gravírozás, felirat, egyedi díj. Nyitva hétfőtől péntekig 8–16 óráig.</p>
            <p className="mt-5 flex flex-wrap gap-3">
              <a href={site.phoneHref} className="btn-red">
                {site.phone}
              </a>
              <Link href="/rendeles" className="btn-outline">
                Rendelés
              </Link>
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
