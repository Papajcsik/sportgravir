# Szabadi Sport Gravír – új weboldal terv (demo)

A sportgravir.hu (Joomla) újraépítése Next.js alapon, saját kezelőfelülettel. Ugyanaz a tartalom (548 termékfotó 34 kategóriában, az árlista, bemutatkozás, szállítás, referenciák, gravírozási eljárások, 86 cikk), serlegbolt-hangulatú új megjelenéssel. Az eredeti oldalon nincs online fizetés és nincs ár a termékeknél, ezért ez sem webshop: a látogató **rendelési listát** állít össze, a gravírozandó szöveget is megírja, a bolt látványtervet küld e-mailben.
Bemutató változat: valódi e-mail nem megy ki, a rendelések az adminba kerülnek.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

- **Admin**: `/admin`, első jelszó `sportgravir2026` (az `ADMIN_PASSWORD` környezeti változóval vagy az admin Beállítások fülén cserélhető).
- Adattárolás: `data/db.json` (fájl); Vercelen Upstash Redis (`UPSTASH_REDIS_REST_URL` / `_TOKEN`) ajánlott, különben ideiglenes tár (az admin figyelmeztet). A `data` mappa nincs verziókezelve.

## Mi van benne

- **Katalógus**: az eredeti oldalról átvett 548 termékfotó (serleg, érem, sportfigura, plakett, üvegdíj, dísztányér, doboz, oklevél, ajándéktárgy, bélyegző), az eredeti címekkel (`/serlegek/premium-serleg`, `/ermek/erembetetek`…). A fotókon a termékek kódja is látszik. A termékek neve az eredeti oldal feliratából, ahol nincs, a kategóriából és a fájlnévből (kód) készült („Érem alap E15”). Minden termékhez saját oldal tartozik (`/termek/…`), kód szerint kereshető.
- **Rendelési lista**: a termék mellett a „Rendelési listához adom” gombbal gyűjthető; a `/rendeles` oldalon darabszám és **gravírozandó szöveg** tételenként, név, telefon, e-mail (mind kötelező, mint az eredeti űrlapon), megjegyzés. A lista a böngészőben marad.
- **Gravírozás, referenciák**: az eljárások (mechanikus, laser, transzfer) és az egyedi gyártás mintái, valamint a referenciák nagyítható fotófalon, billentyűzettel is használható.
- **Árlista** (`/arlista`): az eredeti PDF beágyazva és letölthetően (7 oldal, 2025. február 24-től érvényes).
- **Hasznos információk**: mind a 86 cikk, dátummal, cikklista és főoldali kiemelés.
- **Kapcsolat**: címek, három telefonszám, fax, nyitvatartás, térkép, üzenetküldő űrlap.
- **Menü**: a „Termékeink” gomb kétpaneles nagy menüt nyit (bal oldalt a 10 kategória, jobbra az alkategóriák, három termék és nagy fotó); mobilon harmonikamenü.
- **Kezelőfelület** (`/admin` vagy a jobb szélén az arany fül; bejelentkezve a termékeken és az oldalakon szerkesztés gomb van):
  - **Rendelések**: rendelés / üzenet, a tételekkel és a gravírozandó szöveggel, elintézett jelölés, belső jegyzet.
  - **Termékek**: név, kód, kategória, fotó cseréje (feltöltés), elrejtés, új termék, törlés.
  - **Oldalak, cikkek**: a szövegoldalak és a cikkek címe és szövege (HTML), elrejthető, „Eredeti” gombbal visszaáll.
  - **Statisztika** (napi rendelések, legtöbbet rendelt termékek, megnyitások) és **Beállítások** (közlemény a főoldalon, jelszócsere).
- Akadálymentes, oldaltérkép, `robots.txt`, strukturált adatok (Store, Product, BreadcrumbList).

## Amit érdemes megerősíteni az ügyféllel

- **Árak**: az eredeti weboldalon sincs ár a termékeknél, csak az árlista PDF-ben. Az árlista terméksorszám szerinti táblázat, ezért a PDF-ből az árak a termékekhez rendelhetők lennének (kártyán „2 470 Ft”), ha ezt szeretnék; most a PDF van beágyazva.
- **Kategóriaoldalak szövege** (pl. „Miért serleg legyen a fődíj?”) átkerült, de az adminban egyelőre csak az oldalak és a cikkek szövege szerkeszthető, a kategóriaszövegek nem.
- **„WV” (webveset) oldal** az eredeti láblécéből (a régi weblapkészítő hirdetése) nem került át; a régi cím a főoldalra irányít.
- **Impresszum** az eredeti PDF, a láblécből érhető el.
- A rendelések és üzenetek most csak az adminba kerülnek, élesben e-mail értesítés (sportgravir@t-online.hu) kell hozzá.
- A gravírozásról szóló „látványterv e-mailben, gyártás elfogadás után” szabály a bemutatkozó szövegből jött, a rendelőlap is erre épít.

## Hogyan készült, hogy ne „AI-szagú” legyen

- **Betűk**: Playfair Display (címek), Source Sans 3 (szöveg), Cinzel (a logó, vésett felirat hatású), saját kiszolgálású.
- **Színek**: grafit, elefántcsont, szalagkék sáv, bordó a gombokhoz, sárgaréz arany a vékony vonalakhoz; nincs neon, üveghatás vagy színátmenet.
- **Díszítés**: egyetlen motívum, a vésett babérkoszorú (a címsávokban és a lábléc sarkában); a címsávok alatt dupla aranyvonal, a logó egy érem a szalagján.
- **Képek**: csak az ügyfél saját termékfotói és a bolt fényképei.

## Ellenőrizve

`tsc` és `eslint` hibamentes; rendelés- és üzenet-API-teszt (hiányzó hozzájárulás, e-mail, telefon, üres rendelés, érvénytelen tétel, honeypot, idegen origin elutasítva, a gravírozandó szöveg a rendelésben); böngészős végigkattintás (termék → rendelési lista → gravírozandó szöveg → elküldés, üzenet, fotófal nagyítással, kódkeresés, cikk); admin végigpróbálva (belépés, rossz jelszó, termék szerkesztése, új termék, oldal szövegének szerkesztése és visszaállítása, fülek); 390 px-en nincs vízszintes görgetés; éles build lefut, és nincs 404-es kérés a fő oldalakon.
