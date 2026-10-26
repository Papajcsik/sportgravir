import type { MetadataRoute } from "next";
import { categories, inCategory } from "@/lib/categories";
import { siteUrl } from "@/lib/site";
import { getPages, getVisibleProducts } from "@/lib/store";

const base = siteUrl;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, pages] = await Promise.all([getVisibleProducts(), getPages()]);
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({ url: `${base}${path}`, lastModified: now, changeFrequency, priority });
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    page("/shop", 0.9, "weekly"),
    page("/arlista", 0.8),
    page("/rendeles", 0.6),
    page("/hasznos-informaciok", 0.6, "weekly"),
    ...categories.filter((c) => products.some((p) => inCategory(p, c.path))).map((c) => page(`/${c.path}`, c.parent ? 0.7 : 0.9, "weekly")),
    ...pages.map((p) => page(`/${p.path}`, p.kind === "article" ? 0.4 : 0.6)),
    ...products.map((p) => ({ url: `${base}/termek/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
