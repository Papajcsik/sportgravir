import Link from "next/link";

/** Page links built on the server: the URL keeps the whole filter state. */
export default function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 2) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const cell = "flex min-w-11 items-center justify-center border border-line px-3 py-2 text-[18px] font-extrabold leading-none";
  return (
    <nav aria-label="Oldalak" className="mt-12">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 && (
          <li>
            <Link href={href(page - 1)} rel="prev" className={`${cell} bg-cream text-ink hover:bg-gold`}>
              ‹ Előző
            </Link>
          </li>
        )}
        {nums.map((n, i) => (
          <li key={`${n}-${i}`}>
            {n === "…" ? (
              <span className="px-1 text-ink-2" aria-hidden="true">
                …
              </span>
            ) : n === page ? (
              <span aria-current="page" className={`${cell} bg-ink text-cream`}>
                <span className="sr-only">Oldal </span>
                {n}
              </span>
            ) : (
              <Link href={href(n)} className={`${cell} bg-cream text-ink hover:bg-gold`}>
                <span className="sr-only">Oldal </span>
                {n}
              </Link>
            )}
          </li>
        ))}
        {page < pages && (
          <li>
            <Link href={href(page + 1)} rel="next" className={`${cell} bg-cream text-ink hover:bg-gold`}>
              Következő ›
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
