import data from "./categories.json";

/**
 * The category tree of the live site: every category has the path of the live address ("serlegek/premium-serleg"),
 * which the new site keeps (the pages of the live site, e.g. /serlegek/premium-serleg). A product is listed in the categories of `cats` and counts for every ancestor of those.
 */
export type Category = { path: string; title: string; h1: string; parent: string | null; order: number; img?: string; iw?: number; ih?: number; desc?: string[]; /** the text of the live category page (HTML) */ html?: string };

export const categories = data as Category[];
const byPath = new Map(categories.map((c) => [c.path, c]));
const byLower = new Map(categories.map((c) => [c.path.toLowerCase(), c]));

export const catByPath = (path: string) => byPath.get(path) ?? byLower.get(path.toLowerCase());
export const isCatPath = (path: string) => !!catByPath(path);

const kids = new Map<string, Category[]>();
for (const c of categories) if (c.parent) kids.set(c.parent, [...(kids.get(c.parent) ?? []), c]);
for (const l of kids.values()) l.sort((a, b) => a.order - b.order);

export const childrenOf = (path: string) => kids.get(path) ?? [];
export const rootCategories = categories.filter((c) => !c.parent).sort((a, b) => a.order - b.order);

const descCache = new Map<string, Set<string>>();
/** the category itself and everything below it */
export function withDescendants(path: string): Set<string> {
  let s = descCache.get(path);
  if (!s) {
    s = new Set([path]);
    for (const c of kids.get(path) ?? []) for (const x of withDescendants(c.path)) s.add(x);
    descCache.set(path, s);
  }
  return s;
}

/** True when the product is listed in the category or below it. */
export const inCategory = (p: { cats: string[] }, path: string) => {
  const s = withDescendants(path);
  return p.cats.some((c) => s.has(c));
};

/** "Ereszcsatorna rendszerek › Ereszcsatorna 25-ös keresztmetszet" */
export function crumbsOf(path: string): Category[] {
  const out: Category[] = [];
  let c = catByPath(path);
  while (c) {
    out.unshift(c);
    c = c.parent ? byPath.get(c.parent) : undefined;
  }
  return out;
}
