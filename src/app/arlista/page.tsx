import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageTitle from "@/components/PageTitle";

export const metadata: Metadata = {
  title: "Árlista – serlegek, érmek, plakettek",
  description: "A Szabadi Sport Gravír Kft. árlistája terméksorszám szerint: klasszikus és prémium serlegek, érmek, plakettek, tányérok és a gravírozás díjai.",
  alternates: { canonical: "/arlista" },
};

export default function PriceList() {
  return (
    <div className="pb-8">
      <PageTitle eyebrow="Szabadi Sport Gravír" lead="Az árak a termékek sorszáma szerint, 2025. február 24-től érvényes árlistánkban találhatók. Nyomtatható PDF, 7 oldal.">
        Árlista
      </PageTitle>
      <div className="wrap pt-6">
        <Breadcrumbs items={[{ href: "/arlista", label: "Árlista" }]} />
        <p className="mt-6 flex flex-wrap gap-3">
          <a href="/docs/arlista.pdf" className="btn-red" download>
            Árlista letöltése (PDF)
          </a>
          <a href="/docs/arlista.pdf" className="btn-outline" target="_blank" rel="noopener noreferrer">
            Megnyitás új lapon<span className="sr-only"> (PDF)</span>
          </a>
        </p>
        <div className="mt-6 overflow-hidden rounded-md border border-line bg-white shadow-card">
          <object data="/docs/arlista.pdf#view=FitH" type="application/pdf" aria-label="Árlista (PDF)" className="h-[80vh] min-h-[520px] w-full">
            <p className="p-6 text-[17px]">
              A böngésző nem tudja megjeleníteni a PDF-et. <a href="/docs/arlista.pdf" className="font-bold text-berry underline underline-offset-2">Töltsd le az árlistát</a>.
            </p>
          </object>
        </div>
        <p className="mt-6 text-[16px] text-ink-2">Kérdésed van az árakról? Hívj minket: +36 1 422 1778, vagy írj: sportgravir@t-online.hu.</p>
      </div>
    </div>
  );
}
