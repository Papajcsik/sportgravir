import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import PageTitle from "./PageTitle";

/** Standard layout of the text pages: title band, then a readable column (left-aligned under the headline, not centred). */
export default function InfoPage({ eyebrow, title, lead, wide = false, color, crumbs, children }: { eyebrow?: string; title: string; lead?: string; wide?: boolean; color?: string; crumbs?: Crumb[]; children: React.ReactNode }) {
  return (
    <div className="pb-8">
      <PageTitle eyebrow={eyebrow} lead={lead} color={color}>
        {title}
      </PageTitle>
      <div className="wrap pt-8">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className={`${crumbs ? "mt-8" : ""} ${wide ? "" : "max-w-[860px]"}`}>{children}</div>
      </div>
    </div>
  );
}
