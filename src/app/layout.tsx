import type { Metadata, Viewport } from "next";
import AdminProvider from "@/components/AdminProvider";
import BackToTop from "@/components/BackToTop";
import { CartProvider } from "@/components/CartContext";
import CartAnnouncer from "@/components/CartAnnouncer";
import Footer from "@/components/Footer";
import Header, { type NavItem } from "@/components/Header";
import { catByPath, childrenOf, inCategory, categories, rootCategories } from "@/lib/categories";
import { indexable, site, siteUrl } from "@/lib/site";
import { getVisibleProducts } from "@/lib/store";
import "./fonts.css";
import "./globals.css";

const title = "Szabadi Sport Gravír – serlegbolt, érembolt Budapesten: serlegek, érmek, plakettek, gravírozás";
const description = "Serlegek, érmek, sportfigurák, plakettek, üvegdíjak, dísztányérok és ajándéktárgyak raktárról, azonnali lézeres és mechanikus gravírozással. Serlegbolt Budapesten, a Kerepesi úton, 1990 óta.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "./" },
  title: { default: title, template: "%s – Sport Gravír" },
  description,
  applicationName: site.name,
  keywords: ["serlegbolt", "érembolt", "serleg", "érem", "kupa", "trófea", "plakett", "gravírozás", "lézergravírozás", "sportdíj", "Budapest", "Kerepesi út", "Sport Gravír"],
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: site.name,
    title,
    description: "Serlegek, érmek, plakettek raktárról, azonnali gravírozással Budapesten, 1990 óta.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Szabadi Sport Gravír Kft. – serlegbolt" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#172037",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Store",
      "@id": siteUrl + "/#store",
      name: site.name,
      legalName: site.name,
      url: siteUrl,
      logo: siteUrl + "/icon.png",
      image: siteUrl + "/og.jpg",
      description: "Serlegbolt és érembolt: serlegek, érmek, plakettek, sportdíjak, azonnali gravírozás.",
      telephone: "+3614221778",
      email: site.email,
      foundingDate: "1990",
      address: { "@type": "PostalAddress", streetAddress: site.street, postalCode: site.zip, addressLocality: site.city, addressCountry: "HU" },
      openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "16:00" }],
      sameAs: [site.facebook],
      areaServed: "HU",
    },
    {
      "@type": "WebSite",
      "@id": siteUrl + "/#website",
      url: siteUrl,
      name: site.name,
      inLanguage: "hu",
      publisher: { "@id": siteUrl + "/#store" },
      potentialAction: { "@type": "SearchAction", target: siteUrl + "/kereses?q={search_term_string}", "query-input": "required name=search_term_string" },
    },
  ],
};

/** Marks the document as scripted before first paint. */
const bootScript = `document.documentElement.classList.add('js');`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // products per category (and below it): empty categories stay out of the menus
  const products = await getVisibleProducts();
  const counts: Record<string, number> = {};
  for (const c of categories) counts[c.path] = products.filter((p) => inCategory(p, c.path)).length;
  const live = (path: string) => (counts[path] ?? 0) > 0;
  const col = (path: string) => {
    const c = catByPath(path);
    if (!c || !live(path)) return [];
    return [{ href: `/${c.path}`, title: c.title, n: counts[c.path], kids: childrenOf(c.path).filter((k) => live(k.path)).map((k) => ({ href: `/${k.path}`, title: k.title })) }];
  };
  const pic = (path: string) => {
    const c = catByPath(path);
    return c?.img ? { href: `/${c.path}`, src: c.img, w: c.iw ?? 900, h: c.ih ?? 675, name: c.title } : undefined;
  };
  const nav: NavItem[] = rootCategories
    .filter((c) => live(c.path))
    .map((c) => ({ href: `/${c.path}`, label: c.title, color: "var(--gold)", n: counts[c.path], pic: pic(c.path), items: products.filter((p) => inCategory(p, c.path)).sort((a, b) => a.position - b.position).slice(0, 3).map((p) => ({ href: `/termek/${p.slug}`, name: p.name, src: p.image, w: p.imageW, h: p.imageH })), cols: childrenOf(c.path).filter((k) => live(k.path)).flatMap((k) => col(k.path)) }));

  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        {["source-sans-3-latin", "playfair-display-600-latin"].map((f) => (
          <link key={f} rel="preload" as="font" type="font/woff2" href={`/fonts/${f}.woff2`} crossOrigin="anonymous" />
        ))}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <AdminProvider>
          <CartProvider>
            <a href="#main" className="skip-link">
              Ugrás a tartalomra
            </a>
            <div id="site">
              <Header nav={nav} />
              <main id="main" tabIndex={-1} className="pt-[72px] outline-none xl:pt-[114px]">
                {children}
              </main>
              <Footer nav={nav} />
              <BackToTop />
            </div>
            <CartAnnouncer />
          </CartProvider>
        </AdminProvider>
      </body>
    </html>
  );
}
