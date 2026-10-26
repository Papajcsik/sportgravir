import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageTitle from "@/components/PageTitle";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: "Rendelés – serleg, érem, plakett gravírozással",
  description: "Rendelj online serleget, érmet, plakettet, gravírozással együtt: add meg a gravírozandó szöveget, mi látványtervet küldünk, és csak az elfogadás után kezdjük a gyártást.",
  alternates: { canonical: "/rendeles" },
};

export default function OrderPage() {
  return (
    <div className="pb-8">
      <PageTitle eyebrow="Szabadi Sport Gravír" lead="Miért érdemes tőlünk rendelned: segítünk a választásban, precíz minőségi munka, rövid elkészítési idő. Ha elbizonytalanodnál, hívj minket: +36 30 203 1388.">
        Rendelés
      </PageTitle>
      <div className="wrap pt-6">
        <Breadcrumbs items={[{ href: "/rendeles", label: "Rendelés" }]} />
        <div className="mt-8">
          <QuoteForm mode="order" />
        </div>
      </div>
    </div>
  );
}
