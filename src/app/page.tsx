import Image from "next/image";
import Link from "next/link";
import { catByPath, inCategory, rootCategories } from "@/lib/categories";
import { groupHu } from "@/lib/products";
import { site } from "@/lib/site";
import { getPages, getSettings, getVisibleProducts } from "@/lib/store";

const dayIdx = (new Date().getDay() + 6) % 7; // Monday = 0

const facts = [
  { big: "1990 óta", small: "családi vállalkozásként, Budapesten, a Kerepesi úton" },
  { big: "Azonnal", small: "a raktárról kiszolgált termékek gravírozása helyben megvárható" },
  { big: "1–2 nap", small: "nagyobb mennyiségnél is a teljesítési idő legfeljebb ennyi" },
  { big: "Látványterv", small: "a gravírozásról e-mailben küldjük, a gyártás csak az elfogadás után indul" },
];

const services = [
  { path: "gravirozas/mechanikus-gravirozas", title: "Mechanikus gravírozás", line: "Klasszikus, mély felirat fémre: névtáblák, serlegek, érmek." },
  { path: "gravirozas/laser-gravirozas", title: "Laser gravírozás", line: "Tartós minta és felirat tárgyakra, logók, aláírások, grafikák." },
  { path: "gravirozas/transzfer", title: "Transzferezés", line: "Színes hőtranszferes nyomtatás éremre, plakettre, tányérra." },
];

const text = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export default async function Home() {
  const [all, settings, pages] = await Promise.all([getVisibleProducts(), getSettings(), getPages()]);
  const tiles = rootCategories.map((c) => ({ c, n: all.filter((p) => inCategory(p, c.path)).length })).filter((t) => t.n > 0);
  const heroCats = ["serlegek", "ermek", "plakettek"].map((p) => catByPath(p)).filter((c): c is NonNullable<typeof c> => !!c && !!c.img);
  const arts = pages.filter((p) => p.kind === "article").slice(0, 3);
  const gallery = (path: string) => pages.find((p) => p.path === path)?.gallery?.[0];
  const today = site.hours[dayIdx];

  return (
    <div>
      {settings.notice && (
        <p className="border-b border-line bg-[#f6ecd2] px-5 py-3 text-center text-[17px] font-semibold leading-6 text-ink" role="note">
          {settings.notice}
        </p>
      )}

      {/* hero: three medals of the shelf */}
      <section aria-labelledby="hero-h" className="rings-dark relative overflow-hidden bg-pine on-dark">
        <div className="wrap grid items-center gap-12 pb-16 pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:pb-20 lg:pt-16">
          <div>
            <p className="kicker mb-5">Szabadi Sport Gravír Kft. · Budapest</p>
            <h1 id="hero-h" className="display t-1 max-w-[640px] !text-white">
              Serlegek, érmek, sportdíjak, azonnali gravírozással
            </h1>
            <p className="mt-6 max-w-[560px] text-[19px] leading-8 text-mist">
              {groupHu(all.length)} termék raktárról: serleg, érem, plakett, sportfigura, üvegdíj és dísztányér. A felirat lézerrel vagy mechanikusan készül, kérésre helyben megvárható.
            </p>
            <p className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-gold !px-8 !py-[13px] !text-[18px]">
                Termékeink
              </Link>
              <Link href="/rendeles" className="btn-outline !px-7 !py-[13px] !text-[18px]">
                Rendelés
              </Link>
            </p>
            <p className="mt-5 text-[15.5px] text-mist">
              Ma ({today[0].toLowerCase()}): {today[1]} · {site.address}
            </p>
          </div>

          <ul className="relative mx-auto grid w-full max-w-[460px] grid-cols-3 items-end gap-3" aria-label="Kiemelt kategóriák">
            {heroCats.map((c, i) => (
              <li key={c.path} className={i === 1 ? "pb-10" : i === 2 ? "pb-4" : "pb-0"}>
                <Link href={`/${c.path}`} className="group block text-center">
                  <span className="mx-auto block aspect-square w-full overflow-hidden rounded-full border-[3px] border-gold bg-white p-1.5 shadow-lift">
                    <Image src={c.img!} alt="" width={c.iw ?? 400} height={c.ih ?? 400} priority sizes="150px" className="size-full rounded-full object-contain transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className="display mt-3 block text-[19px] leading-tight text-white group-hover:text-gold">{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="board-edge" aria-hidden="true" />
      </section>

      {/* categories as photo tiles */}
      <section aria-labelledby="kat-h" className="wrap pt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="kat-h" className="display t-2">
            Mit keresel?
          </h2>
          <Link href="/shop" className="text-[16.5px] font-bold text-berry underline underline-offset-4">
            Minden termékünk
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {tiles.map(({ c, n }) => (
            <li key={c.path}>
              <Link href={`/${c.path}`} className="group relative block overflow-hidden rounded-md border border-line bg-white shadow-card transition-shadow hover:shadow-lift">
                {c.img ? <Image src={c.img} alt="" width={c.iw ?? 600} height={c.ih ?? 600} sizes="(min-width: 1024px) 290px, (min-width: 768px) 30vw, 45vw" className="aspect-square w-full bg-white object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]" /> : <span className="rings block aspect-square w-full" aria-hidden="true" />}
                <span className="block border-t-2 border-gold bg-white px-3.5 py-3">
                  <span className="display block text-[20px] leading-tight group-hover:text-berry">{c.title}</span>
                  <span className="text-[14px] font-semibold text-ink-2">{groupHu(n)} termék</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* facts */}
      <section aria-label="Amit tudni érdemes" className="mt-20 bg-paper py-14">
        <ul className="wrap grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <li key={f.big} className="rounded-lg border border-line bg-white p-5 shadow-card">
              <p className="display text-[28px] leading-tight text-berry">{f.big}</p>
              <p className="mt-2 text-[15.5px] leading-6 text-ink-2">{f.small}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* engraving */}
      <section aria-labelledby="grav-h" className="wrap pt-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="grav-h" className="display t-2">
            Gravírozás, felirat
          </h2>
          <Link href="/gravirozas" className="text-[16.5px] font-bold text-berry underline underline-offset-4">
            Minden eljárás
          </Link>
        </div>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {services.map((s) => {
            const g = gallery(s.path);
            return (
              <li key={s.path}>
                <Link href={`/${s.path}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition-shadow hover:shadow-lift">
                  {g && <Image src={g.src} alt="" width={g.w} height={g.h} sizes="(min-width: 768px) 380px, 92vw" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
                  <span className="flex flex-1 flex-col border-t-2 border-gold p-5">
                    <span className="display text-[24px] leading-tight group-hover:text-berry">{s.title}</span>
                    <span className="mt-2 text-[16px] leading-7 text-ink-2">{s.line}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* the shop */}
      <section aria-labelledby="bolt-h" className="wrap pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <p className="kicker mb-4">Serlegboltunk</p>
            <h2 id="bolt-h" className="display t-2">
              Látogass el hozzánk
            </h2>
            <p className="mt-4 max-w-[560px] text-[17.5px] leading-8">Serlegboltunk Budapest egyik legforgalmasabb részén, a Kerepesi úton található, nem messze a Stadion autóbusz-pályaudvartól. A bolt előtt parkolási lehetőség is van. Elegáns, szép környezetben várjuk a vásárlókat.</p>
            <p className="mt-6 flex flex-wrap gap-3">
              <Link href="/cegrol" className="btn-outline">
                Bemutatkozás
              </Link>
              <Link href="/kapcsolat" className="btn-outline">
                Kapcsolat, térkép
              </Link>
            </p>
          </div>
          <div className="grid grid-cols-[1.3fr_1fr] gap-3">
            <Image src="/images/store1.webp" alt="A serlegbolt belülről" width={800} height={600} sizes="(min-width: 1024px) 300px, 55vw" className="row-span-2 h-full w-full rounded-md border border-line object-cover shadow-card" />
            <Image src="/images/store2.webp" alt="Serlegek a polcon" width={800} height={600} sizes="200px" className="aspect-[4/3] w-full rounded-md border border-line object-cover shadow-card" />
            <Image src="/images/store3.webp" alt="Érmek és plakettek a boltban" width={800} height={600} sizes="200px" className="aspect-[4/3] w-full rounded-md border border-line object-cover shadow-card" />
          </div>
        </div>
      </section>

      {/* blog */}
      {arts.length > 0 && (
        <section aria-labelledby="blog-h" className="wrap pt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="blog-h" className="display t-2">
              Hasznos információk, ötletek
            </h2>
            <Link href="/hasznos-informaciok" className="text-[16.5px] font-bold text-berry underline underline-offset-4">
              További cikkek
            </Link>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {arts.map((a) => (
              <li key={a.id}>
                <article className="flex h-full flex-col rounded-lg border border-line bg-white p-5 shadow-card">
                  {a.date && <p className="text-[13.5px] font-semibold text-ink-2">{a.date.split(",")[0]}</p>}
                  <h3 className="display mt-1 text-[21px] leading-snug">
                    <Link href={`/${a.path}`} className="hover:text-berry">
                      {a.title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-4 text-[15.5px] leading-6 text-ink-2">{text(a.html).slice(0, 300)}</p>
                  <p className="mt-auto pt-3">
                    <Link href={`/${a.path}`} className="text-[14.5px] font-bold text-berry underline underline-offset-4">
                      Bővebben<span className="sr-only">: {a.title}</span>
                    </Link>
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* contact */}
      <section aria-labelledby="kapcs-h" className="wrap pt-20">
        <div className="rings relative grid gap-8 overflow-hidden rounded-lg border border-line bg-paper px-7 py-10 sm:px-12 md:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 id="kapcs-h" className="display t-2">
              Rendelj, vagy kérdezz
            </h2>
            <p className="mt-3 max-w-[480px] text-[17.5px] leading-8">Segítünk a választásban és a gravírozás szövegének megfogalmazásában is. Az e-mailben elküldött látványterv elfogadása után indul a gyártás.</p>
            <p className="mt-6 flex flex-wrap gap-3">
              <Link href="/rendeles" className="btn-red !px-8 !py-[13px] !text-[18px]">
                Rendelés
              </Link>
              <a href={site.phoneHref} className="btn-outline !px-7 !py-[13px] !text-[18px]">
                {site.phone}
              </a>
            </p>
          </div>
          <div className="text-[16.5px] leading-7">
            <p className="font-bold text-ink">{site.address}</p>
            <table className="mt-3 w-full max-w-[320px]">
              <caption className="sr-only">Nyitvatartás</caption>
              <tbody>
                {site.hours.map(([d, h], i) => (
                  <tr key={d} className={i === dayIdx ? "font-bold text-ink" : ""}>
                    <th scope="row" className="py-0.5 pr-4 text-left font-[inherit]">
                      {d}
                    </th>
                    <td className="py-0.5">{h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
