/** Set to false to keep search engines out (e.g. for a staging copy that must not compete with the live site). */
export const indexable = true;

/** Canonical origin; override per deployment with NEXT_PUBLIC_SITE_URL. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportgravir.hu";

export const site = {
  name: "Szabadi Sport Gravír Kft.",
  short: "Sport Gravír",
  place: "Serlegbolt, érembolt",
  address: "1148 Budapest, Kerepesi út 40.",
  street: "Kerepesi út 40.",
  zip: "1148",
  city: "Budapest",
  phones: [
    { label: "Telefon", num: "+36 1 422 1778", href: "tel:+3614221778" },
    { label: "Mobil", num: "+36 30 203 1388", href: "tel:+36302031388" },
    { label: "Mobil", num: "+36 30 949 2655", href: "tel:+36309492655" },
  ],
  phone: "+36 1 422 1778",
  phoneHref: "tel:+3614221778",
  fax: "+36 1 422 1779",
  email: "sportgravir@t-online.hu",
  mapUrl: "https://maps.app.goo.gl/w7N8vai9jeTVBZzx9",
  facebook: "https://www.facebook.com/SzabadiSportGravir/",
  hours: [
    ["Hétfő", "8:00–16:00"],
    ["Kedd", "8:00–16:00"],
    ["Szerda", "8:00–16:00"],
    ["Csütörtök", "8:00–16:00"],
    ["Péntek", "8:00–16:00"],
    ["Szombat", "zárva"],
    ["Vasárnap", "zárva"],
  ] as const,
};

export const infoNav = [
  { href: "/cegrol", label: "Bemutatkozás" },
  { href: "/referenciak", label: "Referenciák" },
  { href: "/arlista", label: "Árlista" },
  { href: "/szallitas", label: "Szállítás" },
  { href: "/hasznos-informaciok", label: "Hasznos információk" },
  { href: "/kapcsolat", label: "Kapcsolat" },
];

export const legalNav = [{ href: "/docs/impresszum.pdf", label: "Impresszum" }];
