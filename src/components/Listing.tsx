import Image from "next/image";
import Link from "next/link";
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import { CatalogProvider, ResultsPane } from "./CatalogNav";
import { AddProductButton } from "./EditButton";
import FilterForm from "./FilterForm";
import PageTitle from "./PageTitle";
import Pagination from "./Pagination";
import ProductCard from "./ProductCard";
import { PAGE_SIZE, filterProducts, parseQuery, queryString, sortProducts, type Query } from "@/lib/catalog";
import { childrenOf, inCategory } from "@/lib/categories";
import { groupHu, toCard } from "@/lib/products";
import { getSettings, getVisibleProducts } from "@/lib/store";

type SP = Record<string, string | string[] | undefined>;
const textLen = (h: string) => h.replace(/<[^>]+>/g, "").trim().length;

/**
 * A product list with search, sort and paging: used by the category pages, the shop page and the search.
 * `base` is the address of the page; the state lives in its query string.
 */
export default async function Listing({
  base,
  title,
  eyebrow,
  lead,
  path,
  crumbs,
  searchParams,
  fixed,
  html,
  tilesOf,
  tiles,
}: {
  base: string;
  title: string;
  eyebrow?: string;
  lead?: string;
  /** category path whose subtree is listed */
  path?: string;
  crumbs?: Crumb[];
  searchParams: SP;
  fixed?: Partial<Query>;
  /** descriptive text shown under the list */
  /** the text of the category page (HTML): a short one stands above the list, a long one below it */
  html?: string;
  /** category whose children are shown as photo tiles above the list */
  tilesOf?: string;
  /** an explicit list of tiles (the shop page shows the top categories) */
  tiles?: { path: string; title: string; img?: string; iw?: number; ih?: number }[];
}) {
  const q = parseQuery(searchParams, fixed);
  const [all, settings] = await Promise.all([getVisibleProducts(), getSettings()]);
  const found = sortProducts(filterProducts(all, q, path), q.sort);
  const pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
  const page = Math.min(q.page, pages);
  const items = found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toCard);
  const kids = (tiles ?? (tilesOf ? childrenOf(tilesOf) : []))
    .map((k) => ({ cat: k, n: all.filter((p) => inCategory(p, k.path)).length }))
    .filter((t) => t.n > 0);
  const state = { q: q.q, sort: q.sort };

  return (
    <div className="pb-8">
      <PageTitle eyebrow={eyebrow} lead={lead}>
        {title}
      </PageTitle>
      <div className="wrap pt-6">
        {crumbs && <Breadcrumbs items={crumbs} />}
        {settings.notice && <p className="mt-5 rounded-md border border-gold bg-[#f6ecd2] px-5 py-3 text-[17px] font-semibold leading-7 text-ink">{settings.notice}</p>}
        <AddProductButton className="mt-4" />
        {html && textLen(html) < 300 && <div className="wp mt-6" dangerouslySetInnerHTML={{ __html: html }} />}

        {kids.length > 0 && (
          <nav aria-label="Alkategóriák" className="mt-8">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {kids.map(({ cat, n }) => (
                <li key={cat.path}>
                  <Link href={`/${cat.path}`} className="group relative block overflow-hidden rounded-md border border-line bg-paper">
                    {cat.img ? <Image src={cat.img} alt="" width={cat.iw ?? 900} height={cat.ih ?? 675} sizes="(min-width: 1024px) 290px, 45vw" className="aspect-square w-full bg-white object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]" /> : <span className="rings block aspect-[4/3] w-full" aria-hidden="true" />}
                    <span className="block border-t-2 border-gold bg-white px-3.5 py-2.5">
                      <span className="display block text-[19px] leading-tight group-hover:text-berry">{cat.title}</span>
                      <span className="text-[14px] font-semibold text-ink-2">{groupHu(n)} termék</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <CatalogProvider action={base}>
          <div className="mt-10 rounded-lg border border-line bg-cream p-4 sm:p-5">
            <FilterForm state={state} action={base} />
          </div>

          <ResultsPane labelledBy="results-title">
            <div className="mb-6 mt-8 flex flex-wrap items-center justify-between gap-3">
              <h2 id="results-title" className="display text-[28px] leading-none">
                {groupHu(found.length)} termék
              </h2>
              <p role="status" className="sr-only">
                {groupHu(found.length)} találat
              </p>
            </div>

            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-ink/40 bg-cream px-6 py-14">
                <p className="display t-3">Erre a keresésre nincs találat</p>
                <p className="mt-2 max-w-[520px] text-[17px] leading-7 text-ink-2">Próbálj rövidebb szót vagy kódot, vagy írj nekünk: egyedi díjat és a weboldalon nem szereplő termékeket is tudunk szerezni.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={base} className="btn-outline">
                    Keresés törlése
                  </Link>
                  <Link href="/elerhetosegeink" className="btn-red">
                    Írok nektek
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
                {items.map((p, i) => (
                  <li key={p.id}>
                    <ProductCard product={p} priority={i < 4} />
                  </li>
                ))}
              </ul>
            )}
            <Pagination page={page} pages={pages} href={(p) => `${base}${queryString(q, { page: p })}`} />
          </ResultsPane>
        </CatalogProvider>

        {html && textLen(html) >= 300 && (
          <section aria-label="A kategóriáról" className="mt-16">
            <div className="wp" dangerouslySetInnerHTML={{ __html: html }} />
          </section>
        )}
      </div>
    </div>
  );
}
