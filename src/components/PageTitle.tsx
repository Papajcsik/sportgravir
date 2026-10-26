/** Page heading: sawdust band with the growth rings of a log, the headline in the serif face, an optional lead paragraph, a board edge below. */
export default function PageTitle({ eyebrow, children, id, lead, color = "var(--gold)", aside }: { eyebrow?: string; children: React.ReactNode; id?: string; lead?: string; color?: string; /** right-hand side of the band (counts, actions) */ aside?: React.ReactNode }) {
  return (
    <header className="rings relative overflow-hidden bg-paper" style={{ ["--c" as string]: color }}>
      <div className="wrap flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pb-8 pt-8 sm:pb-10 sm:pt-10">
        <div className="min-w-0 max-w-[860px]">
          {eyebrow && <p className="kicker mb-3">{eyebrow}</p>}
          <h1 id={id} className="display t-1">
            {children}
          </h1>
          {lead && <p className="mt-4 max-w-[720px] text-[18px] leading-8 text-ink-2">{lead}</p>}
        </div>
        {aside}
      </div>
      <div className="board-edge" aria-hidden="true" />
    </header>
  );
}
