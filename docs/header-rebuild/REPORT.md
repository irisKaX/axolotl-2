# Izolovaný Header Rebuild

Jediný nový header zachovává C2 chování a charakter Refined Spatial B. Produkční header ani existující experimenty se neupravují. Větev: `feat/header-rebuild-isolated`. Integrace do main ani produkční nasazení nejsou součástí tohoto předání.

- [Veřejné preview](https://iriskax.github.io/axolotl-preview/header-rebuild/)
- [Galerie screenshotů a referencí](https://iriskax.github.io/axolotl-preview/header-rebuild/evidence/)
- [Zdrojová větev](https://github.com/irisKaX/axolotl-2/tree/feat/header-rebuild-isolated)

## Zafixované podklady

| Podklad | Commit |
| --- | --- |
| Produkční základ | `86e0ff33f00c51e3e56d7b0fd88bb05e06ab6a47` |
| Schválené C2 | `5bc0bd8fc6463fa8ad7d8e051e181386da2af486` |
| Refined Spatial B | `f25ab73bfb4f7d1de6bc63215c6247dc91bd29d6` |
| Blueprint / Design Lab | `d3d1aacdf8a76c72df727978e43d85b02826c0d0` v axolotl-knowledge |

Reference jsou v `references/`: dark/light, 1440/1024/390 × 844, fixovaný čas, Chromium, omezené animace. `references/computed.json` ukládá skutečné vypočtené styly i geometrii. Skript `scripts/header-rebuild/freeze-references.mjs` je zachován pro reprodukci. Referenční snímky se nepřepisují testy nové implementace.

Vizuální ověření kombinuje porovnání screenshotů, měření geometrie a testy vypočtených stylů. Není prezentováno jako nulový pixelový rozdíl: sjednocení původně rozdílných popupů záměrně mění jejich vnitřní rozměry a polohu.

## Architektura

Šest implementačních React souborů + jeden soubor testů a scoped CSS; žádná komponenta pro každou jednotlivou ikonu.

| Soubor v `src/app/header/` | Odpovědnost |
| --- | --- |
| `AppHeader.tsx` | Kompozice, responzivní režim, změřený odstup obsahu, hodiny a akce |
| `Navigation.tsx` | C2 accordion a desktopová navigace nad společnými route daty |
| `Popover.tsx` | Jeden otevřený popup, portál, positioning, mouse/touch, fokus a dismissal |
| `PanelUI.tsx` | Společné ovládací prvky, hlavička/patička panelu a řádky |
| `UrlControl.tsx` | Draft/commit URL, validace a seznam karet |
| `SettingsPanel.tsx` | Nastavení a podstránky, nativní selecty |
| `header.module.css` | Společné materiály, typografie, ikony, spacing a interaktivní stavy |

Desktop používá existující nezměněný PillNav v režimu `collapse="never"`. Vyhýbá se kopii jeho animačního enginu. Kompaktní režim řídí výhradně nový header: do 1180 px, při zvětšení textu do 1360 px. Zachování závislosti na starém PillNav je vědomý kompromis; další extrakce může přijít až při schválené produkční migraci.

Floating UI React 0.27.20 řeší ne-modální portály, safe hover path a interakce. Každý panel začíná 12 px pod **celým** headerem. Výška zohledňuje visual viewport a safe area, scrolluje panel. Otevření nemění šířku dokumentu, pozici workspace ani body overflow. Po breakpoint změně se neplatný popup zavře a fokus přejde na odpovídající navigační ovladač.

C2 zachovává reset dashboardu, obnovení skupiny aktivní route při každém otevření, nejvýše jednu rozbalenou skupinu, možnost vše zavřít a zavření po výběru stejné route. Aktivní položka má `aria-current`, fialový podklad a check. Escape vrací fokus; kliknutí ven ponechává fokus cíli kliknutí. Tab prochází i portál v logickém pořadí.

## Společný vizuální systém

| Token/pravidlo | Hodnota |
| --- | --- |
| Aktivní stav | `#7c3aed`, bílý text; zůstává i při hover |
| Neutrální hover řádku, dark | `rgba(255,255,255,.06)` |
| Neutrální hover řádku, light | `rgba(24,24,27,.05)` |
| Desktopový top-level hover | Původní fialový fill PillNav |
| Desktopová aktivní položka submenu | Fialový tint 18 % |
| Panel | Společný gradient, border, shadow, radius 28 px |
| Panel padding | 16 px desktop / 14 px mobil |
| Řádek | Min. 44 px, radius 12 px, gap 12 px |
| Ikony | 18 px, stejný stroke a zarovnání |
| Text | Základ 13 px, nadpis 16 px, zvětšení 115 % |
| Focus | Jediný outline 2 px, offset 3 px |
| Nav / URL | Výška 48 px |
| Akční tlačítko | Viditelná plocha 38 px, hit area 44 px |

Nav, nastavení, upozornění a karty sdílejí stejné komponenty a CSS, nejen souřadnice. Nativním selectům je vyhrazen prostor pro chevron; vzhled otevřeného OS seznamu se může mezi prohlížeči lišit.

## Izolace a spuštění

`header-rebuild.html` → `src/pages/header-rebuild/main.tsx` → nový AppHeader a existující ToolWorkspace. `vite.header-rebuild.config.ts` má samostatný výstup `dist-header-rebuild`. Preference používají prefix `axolotl-header-rebuild`. Preview-only Vite transform změní konstantu sessionStorage klíče při kompilaci bridge; původní modul se nemění a runtime nikdy neprohazuje produkční klíč. Pokud se očekávaná konstanta změní, build selže a vyžádá kontrolu adaptéru.

```sh
npm ci
npm run dev:header
# /axolotl-2/header-rebuild.html
npm run build:header
npm run test:header:browser
```

Pro lokální Chromium lze nastavit `PLAYWRIGHT_CHROME_EXECUTABLE`. CI instaluje vlastní Chromium/WebKit/Firefox. Reprodukce screenshotů používá fixovaný čas z testu, nikoli aktuální čas hodin.

## Ověření

- Unit: **56/56** (50 původních + 6 nových integračních testů).
- Legacy: **4/4**; nástroje/bridge: **335/335**.
- Typecheck, produkční build a samostatný preview build prošly.
- Nová browser sada: **25/25 Chromium** proti sestavenému preview; log je zaznamenán v `results/header-chromium.txt`; CI ověřuje také WebKit a Firefox.
- Axe kontroluje header a všechny čtyři druhy popupů + vzhled v obou tématech; výsledky v `results/measurements.json`.
- Matrix všech popupů: dark/light, 1440/1024/390. Dále 320 až 1440, obě strany breakpointů, text 115 %, krátký viewport 390×400, dotyk, klávesnice, hover, aktivní hover, URL validace, historie, vybraná/odebraná karta a modal skutečného konvertoru.
- Původní browser sada: **4/4 v CI** ([běh](https://github.com/irisKaX/axolotl-2/actions/runs/39076160898)). Lokálně **3/4**, shodně s čistým výchozím commitem. Jediný pád je existující desktop alignment assertion: naměřeno přesně 2 px, test požaduje `< 2`. Produkční kód ani jeho test se kvůli tomu neupravoval. Srovnání buildů: **44/44 souborů bitově shodných** i po finálních změnách; kontrolní součty jsou v `results/production-build-equality.json`.
- Nezávislé review nalezlo a následně ověřilo opravu priority active+hover a izolace URL při vyčerpané storage. Workflow preview prošlo review zachování původních labů. Cross-browser kontrola navíc odhalila nepojmenované Safari focus guards ve Floating UI; lokální adaptér je pojmenovává bez změny jejich chování a bez výjimek v axe testech. Adaptér prošel nezávislým review.

## Odchylky a zbývající závislosti

1. **Sjednocené popupy:** oproti B mají všechny společný materiál, 12px radius řádků, stejnou typografii, zavírací ovladač a patičku. Pravé nabídky se kotví pod celý header a dorovnávají k triggeru. To je záměrná realizace požadované jednoty a oprava překrývání; charakter nosiče, raised controls a recessed URL zůstává.
2. **Rozšíření na preview:** současný distribuovaný doplněk podporuje `/axolotl-2/`, nikoli novou preview cestu. UI to uvádí. Automatické scénáře karet používají skutečný protokol s fixture; nejsou důkazem připojeného fyzického rozšíření na preview. Ruční URL, QR a konvertor jsou funkční. Produkční allowlist doplňku zůstává beze změny.
3. **Nativní platformy:** engine WebKit není fyzický iPhone a Linux Chromium není Safari na Macu. Finální ověření skutečné mobilní klávesnice, safe areas a nativních selectů na uživatelových zařízeních zůstává před produkční integrací.
4. **Záměrně omezená abstrakce:** původní PillNav zůstává desktopovou závislostí a nastavení používá existující providery. Nové tokeny jsou scoped; globální CSS se nečistí bez autorizace produkční migrace.

## Publikace a návrat

Zdroj je jen ve feature větvi. Workflow v `axolotl-preview`, větev `preview/header-responsive-lab`, nadále staví původní laby z `f25ab73…` a přidává oddělený build do `/header-rebuild/`. Přesný zdrojový commit je veřejně v `header-rebuild/source-commit.txt`. Žádná změna main ani produkčního Pages deploymentu.

Rollback preview: vrátit pouze změnu `.github/workflows/preview.yml` v preview větvi na původní konfiguraci a znovu spustit její workflow; odstraní novou podcestu a zachová dosavadní laby. Produkce nevyžaduje rollback. Veřejný smoke test kontroluje přesný zdrojový SHA, všechna čtyři menu v obou tématech, URL, galerii a zachování původních C2/B labů. Další krok je vizuální a funkční schválení tohoto preview; produkční integrace vyžaduje nové výslovné povolení.
