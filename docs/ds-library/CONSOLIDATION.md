# Jediný katalog · Design System Library V1.1

Cíl: https://iriskax.github.io/axolotl-preview/ds-library-v1-1/#design-system

Pracovní větev: `design-system/consolidate-v1-1`. Změny nejsou nasazené.

- Základ Library V1.1 a její registr zůstávají zachované, včetně Buttonu a React Bits Star Border. Návrhy nejsou automaticky schválené.
- Header, bento, Office placeholder a povrchy šesti widgetů jsou převzaté z přesné reference `axolotl-preview@523c983`. Kanonický zdroj: `public/library/dashboard/`; iframe uvnitř katalogu izoluje původní CSS bez redesignu. Přímá adresa náhledu vrací do katalogu.
- Brand & Mascot přebírá identitu V3, všech deset barev a pravidla z knowledge revize `316927f`. Master obrázek v repozitáři chybí a je tak označený. Historické Office assety jsou pouze odkazované jako archiv, ne jako náhrada V3.
- Layout Studio zmizelo z aktivního registru; jeho podklady a skutečné widgetové exporty zůstávají. Stará `section=layout`, `catalog=legacy` a `catalog=headers` v samostatném buildu vedou do Dashboardu.
- Historické veřejné preview adresy mají přesměrování připravená ve větvi axolotl-preview. Prototype a component-catalog mají vlastní pracovní větve se stejným přesměrováním. Historie ani celé repozitáře se nemažou.
- Soukromá Inspiration Library zůstává beze změn a její obsah není publikovaný.
- Produkční main, App, Header, runtime nástrojů i stará produkční routa jsou beze změn. Živé přesměrování produkčního katalogu vyžaduje samostatně schválenou produkční změnu.

## Vývoj a kontrola

`npm ci`, pak `node scripts/ds-library/build.mjs`. Build používá stejnou Library přes `library.html`, nikoli produkční App. Výstup je `dist/` se stejnou cílovou cestou `/axolotl-preview/ds-library-v1-1/`.

Lokálně: `npm run dev -- --host 127.0.0.1`, vstup `library.html#design-system`. Pro sestavenou verzi použij `npm run preview -- --host 127.0.0.1 --port 4185 --base /axolotl-preview/ds-library-v1-1/`.

Kontrola sestavené verze: `node scripts/ds-library/check-consolidation.mjs`.

Ověřeno: TypeScript a build, registr, načtení deseti kategorií, skutečný Header (menu, Escape, URL, dark/light), sedm bento buněk a mobilní overflow, Star Border a omezení pohybu. Automatický axe audit hlavního katalogu a Dashboardu: žádná porušení kontrolovaných WCAG A/AA pravidel. Ruční audit čtečkou obrazovky není součástí této kontroly.

Každý další vizuální vývoj začíná v tomto registru. Stavy: Návrh / Schváleno, nezávisle Produkčně použito. Převzatý Header a bento jsou schválené; jejich přesný preview vzhled není produkčně použitý.

Publikace vyžaduje výslovný souhlas. Review workflow axolotl-preview vytváří pouze artifact a nemá deployment job.
