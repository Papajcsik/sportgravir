import Link from "next/link";
import Breadcrumbs from "./Breadcrumbs";
import { EditButton } from "./EditButton";
import ProductBuy from "./ProductBuy";
import ProductCard from "./ProductCard";
import ProductGallery from "./ProductGallery";
import ProductView from "./ProductView";
import { catByPath, crumbsOf } from "@/lib/categories";
import { toCard, type Product, type ProductDetails } from "@/lib/products";
import { site, siteUrl } from "@/lib/site";
import { getVisibleProducts } from "@/lib/store";

/** A catalogue item: the photo, its code, the order button and more of the same kind. */
export default async function ProductPage({ p, details }: { p: Product; details: ProductDetails }) {
  const all = await getVisibleProducts();
  const related = all.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4).map(toCard);
  const crumbs = crumbsOf(p.cat);
  const images = [{ src: p.image, w: p.imageW, h: p.imageH }, ...(details.images ?? [])];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    ...(p.sku ? { sku: p.sku } : {}),
    image: [p.image.startsWith("http") ? p.image : `${siteUrl}${p.image}`],
    category: catByPath(p.cat)?.title,
    brand: { "@type": "Organization", name: site.name },
  };

  return (
    <div className="pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView slug={p.slug} />
      <div className="wrap pt-6">
        <Breadcrumbs items={[{ href: "/shop", label: "Termékeink" }, ...crumbs.map((c) => ({ href: `/${c.path}`, label: c.title })), { href: `/termek/${p.slug}`, label: p.name }]} />
      </div>

      <div className="wrap mt-6 grid gap-10 lg:grid-cols-[minmax(0,580px)_1fr] xl:gap-14">
        <div className="relative lg:sticky lg:top-[136px] lg:self-start">
          <EditButton id={p.id} className="absolute left-3 top-3 z-10" />
          <ProductGallery name={p.name} images={images} />
        </div>

        <div className="min-w-0">
          <p className="text-[14px] font-bold uppercase tracking-[0.12em] text-gold-dark">{crumbs[crumbs.length - 1]?.title}</p>
          <h1 className="display mt-2 text-[clamp(30px,3.6vw,44px)] leading-[1.08]">{p.name}</h1>
          {p.sku && <p className="mt-3 inline-block rounded-sm bg-paper px-3 py-1.5 text-[17px] font-bold text-ink">Kód: {p.sku}</p>}
          <p className="mt-4 max-w-[560px] text-[17.5px] leading-8">Az árat az <Link href="/arlista" className="font-bold text-berry underline underline-offset-2">árlistánkban</Link> találod. A kiválasztott terméket gravírozással együtt is elkészítjük: a felirat szövegét a rendelési listában írhatod meg.</p>

          <div className="mt-7 rounded-lg border border-line bg-cream p-5 shadow-card sm:p-6">
            <h2 className="display text-[26px] leading-none">Rendelem</h2>
            <p className="mt-2 text-[15.5px] leading-6 text-ink-2">Add hozzá a terméket a rendelési listához, a végén írd meg az adataidat és a gravírozandó szöveget. A gravírozásról látványtervet küldünk e-mailben, és csak az elfogadás után kezdjük el a gyártást.</p>
            <div className="mt-5 border-t border-line pt-5">
              <ProductBuy product={toCard(p)} />
            </div>
          </div>

          <ul className="mt-5 grid gap-3 text-[15.5px] leading-6 sm:grid-cols-3">
            <li className="rounded-md border border-line bg-white p-3.5">
              <strong className="block text-ink">Raktárról</strong>
              Azonnali gravírozás, helyben megvárható.
            </li>
            <li className="rounded-md border border-line bg-white p-3.5">
              <strong className="block text-ink">Rövid határidő</strong>
              Nagyobb mennyiségnél is 1–2 nap.
            </li>
            <li className="rounded-md border border-line bg-white p-3.5">
              <strong className="block text-ink">Szállítás</strong>
              Postával az ország egész területére.
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="hasonlo" className="wrap mt-16">
          <h2 id="hasonlo" className="display t-2 mb-6">
            Még ebből a kategóriából
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-4">
            {related.map((r) => (
              <li key={r.id}>
                <ProductCard product={r} />
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link href={`/${p.cat}`} className="font-bold text-berry underline underline-offset-4">
              A teljes kategória
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
