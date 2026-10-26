import type { ReactNode } from "react";

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/**
 * Renders text lines: "## text" is a heading, "- text" a list item, anything else a paragraph.
 * Headings get ids (and `toc` lists them) so long documents can be navigated.
 */
export default function Prose({ lines, toc = false, className = "" }: { lines: string[]; toc?: boolean; className?: string }) {
  const used = new Set<string>();
  const idFor = (t: string) => {
    let id = slug(t) || "resz";
    for (let i = 2; used.has(id); i++) id = `${slug(t)}-${i}`;
    used.add(id);
    return id;
  };
  const heads: { id: string; text: string }[] = [];
  const out: ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    if (t.startsWith("## ")) {
      const text = t.slice(3);
      const id = idFor(text);
      heads.push({ id, text });
      out.push(
        <h2 key={i} id={id} className="display t-3 !mt-10 scroll-mt-40 first:!mt-0">
          {text}
        </h2>,
      );
    } else if (t.startsWith("- ")) {
      const li: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) li.push(lines[i++].slice(2));
      i--;
      out.push(
        <ul key={i} className="list-square space-y-1.5 pl-6 marker:text-gold-dark">
          {li.map((x, n) => (
            <li key={n} className="pl-1">
              {x}
            </li>
          ))}
        </ul>,
      );
    } else {
      out.push(<p key={i}>{t}</p>);
    }
  }
  return (
    <div className={className}>
      {toc && heads.length > 3 && (
        <nav aria-label="Tartalomjegyzék" className="mb-10 border border-line rounded-xl bg-cream p-6">
          <p className="display text-[19px]">Tartalom</p>
          <ol className="mt-3 columns-1 gap-8 text-[16px] leading-7 sm:columns-2">
            {heads.map((h) => (
              <li key={h.id} className="break-inside-avoid">
                <a href={`#${h.id}`} className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:text-berry">
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="space-y-4 text-[17px] leading-8 text-ink-2">{out}</div>
    </div>
  );
}
