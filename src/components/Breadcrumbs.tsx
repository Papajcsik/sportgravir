import Link from "next/link";
import { siteUrl } from "@/lib/site";

export type Crumb = { href: string; label: string };

/** Visible trail ("Kezdőlap / Fenyő fűrészáru / …") plus the matching BreadcrumbList JSON-LD. The last crumb is the current page. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ href: "/", label: "Kezdőlap" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${siteUrl}${c.href === "/" ? "" : c.href}` })),
  };
  return (
    <nav aria-label="Navigációs út" className="text-[15px] leading-6 text-ink-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol className="flex flex-wrap items-center gap-x-2">
        {all.map((c, i) => (
          <li key={c.href} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="font-extrabold text-ink/50">
                ›
              </span>
            )}
            {i === all.length - 1 ? (
              <span aria-current="page" className="font-extrabold text-ink">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="font-semibold underline decoration-ink/30 underline-offset-2 hover:text-berry hover:decoration-berry">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
