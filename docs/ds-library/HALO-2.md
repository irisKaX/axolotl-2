# Halo 2.0 · materiál a interakce

> Historický záznam před vizuálním sjednocením. Aktuální stav a API popisuje [VISUAL-UNIFICATION.md](VISUAL-UNIFICATION.md). Historické varianty nejsou aktivní součástí katalogu.

Izolovaná implementace ve větvi `experiment/ds-library-v1-1`. Rozšiřuje existující Cards & Surfaces v Design System Library V1.1. Všechny nové varianty jsou **Návrh**, jejich produkční použití je **ne**. Původní Halo, Obsidian a Studio Outline zůstávají dostupné.

## Sdílené API

```tsx
<ToolCard
  family="halo"
  halo={{
    intensity: "cinematic",
    accent: "#7C3AED",
    effects: { spotlight: true, edge: true, tilt: true,
      parallax: true, ambient: true, sheen: true, lift: true },
  }}
  title="Metadata"
  description="Připrav stránku na první dojem."
  action={<Button>Otevřít</Button>}
/>
```

`halo` je volitelné, společné pro Card, InteractiveCard, ToolCard, WidgetCard, Panel a StateCard. Vyžaduje `family="halo"`. Bez `halo` se zachovává původní materiál i DOM obsahu. `disabled` v HaloOptions vypíná efekty; dostupnost akcí nadále řídí jejich vlastní disabled/loading vlastnosti. InteractiveCard automaticky přenáší svůj disabled/loading stav do efektů. Jiné rodiny se nemění.

| Intenzita | Výchozí konzumenti | Materiál a pohyb |
| --- | --- | --- |
| Soft | Card, Panel, StateCard | Satén, subtilní hrana a ambient; nulový náklon a posun |
| Spatial | InteractiveCard, WidgetCard | Vrstvený povrch, jemný lift 4 px, náklon do 3,5°, parallax do 4 px |
| Cinematic | ToolCard | Výraznější hrany a stín, lift 8 px, náklon do 10°, parallax do 12 px |

Amplitudy jsou maxima na okraji karty. Obsah, hlavička a akce mají různé hloubkové vzdálenosti. Světlý režim používá bílý materiál a chladné stíny; nejde o invertovaný dark. Akcenty katalog načítá ze stávajícího registru barev včetně Axolotl Violet a O2 Blue. Registry barev ani jejich CSS hodnoty se neupravují.

V katalogu lze vybrat intenzitu, porovnat všechny tři nebo původní Halo s novým, vypínat sedm efektů, měnit akcent a zkoušet loading/disabled i obsahové stavy. Soft i po zapnutí přepínačů náklonu zůstává klidným profilem; přepínače vybírají efekty, nikoli jejich amplitudy. Ukázkové akce pracují pouze s lokálním stavem, nespouštějí produkční nástroje.

## Reference a licence — ověřeno 19. 10. 2026

### Spotlight Card / GlowCard

- [Referenční stránka 21st.dev, Hossain Jahed](https://21st.dev/@jahed/components/spotlight-card)
- Ověřený veřejný popis a usage API: GlowCard, barevné předvolby, sm/md/lg, vlastní rozměry a className, kurzorové světlo a CSS proměnné.
- [Oficiální technický přehled spotlight principu](https://21st.dev/blog/react-spotlight-effect-components)
- **Omezení ověření:** kompletní aktuální implementace, přesný seznam závislostí a licence této konkrétní komponenty nebyly přes dostupné rozhraní ověřitelné. Stránka zpřístupnila usage, nikoli úplný zdroj. Její kód proto nebyl převzat. Nepředpokládáme licenci MIT jen podle katalogu.
- Použitý princip: souřadnice kurzoru → CSS proměnné → směrové radiální světlo.

### Magic Bento

- [Aktuální originální TS implementace](https://github.com/DavidHDev/react-bits/blob/e12c22192ac7b4b452c5e2feb9b586d74765d696/src/ts-default/Components/MagicBento/MagicBento.tsx)
- Ověřeno celé TS/CSS a registry JSON na revizi `e12c22192ac7b4b452c5e2feb9b586d74765d696`.
- Originál používá vlastní rAF engine, pružinový náklon/magnetismus, vyhlazování světla, přímé CSS zápisy, IntersectionObserver a ResizeObserver. Dále obsahuje grid, demo vizuály, volitelný canvas/částice a úvodní/click efekty.
- API mj. enableSpotlight, spotlightRadius, enableBorderGlow, glowColor, enableTilt, enableMagnetism, enableStars, particleCount, intro, clickEffect, disableAnimations, layout a theme.
- Aktuální registry závislosti: `@hugeicons/react@^1.1.10`, `@hugeicons/core-free-icons@^4.3.3`; tato revize nepoužívá GSAP.
- Převzaté principy: oddělení pohybového controlleru od renderu, více hloubkových vrstev, vyhlazování a uspávání. Vlastní Axolotl implementace bez gridu, částic, úvodní animace, magnetického posunu a nových knihoven.

### Border Glow

- [Aktuální originální TS implementace](https://github.com/DavidHDev/react-bits/blob/e12c22192ac7b4b452c5e2feb9b586d74765d696/src/ts-default/Components/BorderGlow/BorderGlow.tsx)
- Ověřeno celé TS/CSS a registry JSON na stejné revizi. Pouze React, žádné další runtime závislosti.
- API: edgeSensitivity, glowColor, backgroundColor, borderRadius, glowRadius, glowIntensity, coneSpread, animated, colors, fillOpacity.
- Originál odvozuje úhel a blízkost hrany od kurzoru, kombinuje radiální mesh, conic masky a vrstvené stíny. Volitelná úvodní animace v přečtené verzi nemá kompletní obsluhu reduced motion/cleanup vhodnou pro náš use case.
- Použitý princip: úhel obrysu a jeho intenzita podle polohy u hrany. Vlastní lehčí conic maska bez automatického intro efektu.

[Licence aktuálního React Bits](https://github.com/DavidHDev/react-bits/blob/e12c22192ac7b4b452c5e2feb9b586d74765d696/LICENSE.md): **MIT + Commons Clause**, copyright 2026 DavidHaz. Umožňuje použití v aplikacích při zachování podmínek, omezuje prodej/distribuci samotných komponent jako produktu. Nejde o neomezenou MIT. Halo 2.0 nekopíruje implementaci žádné ze tří referencí; používá vlastní kód založený na popsaných interakčních principech. Nepřidává závislosti a nemění existující integrace ani licence Star Border / Dark Veil.

## Výkon a přístupnost

- Pointer události mění cílové hodnoty mimo React state. rAF vyhlazuje pohyb a zapisuje CSS proměnné; po ustálení končí. Žádné nekonečné dekorativní animace.
- Bounding rect se měří při vstupu, ne v každém snímku. Scroll/resize/blur/opuštění viewportu resetují stav. Cleanup ruší rAF, listenery i observers.
- `will-change` platí jen během vyhlazování. Bez blur, WebGL, canvasu nebo knihovny animací.
- Vypnutí všech efektů neplánuje rAF. Reduced motion (OS i provider), coarse pointer a touch používají statický materiál. Změna OS preference se projeví i za běhu.
- Dekorace mají `pointer-events:none` a `aria-hidden`. Skutečné akce zůstávají nativními tlačítky; žádná vnořená tlačítka.
- Focus má vlastní prstenec, nezávislý na kurzoru; nepřekrývá se s vybraným stavem. Vypnutý světelný obrys zůstává vypnutý i při focusu.
- Náklad aktualizovaných gradientů není nulový (vyžaduje paint). Netvrdíme garantovaných 60 FPS na všech zařízeních. Výkon je omezen aktivní kartou a dobou ustalování; mobil má statický fallback. Výraznější Cinematic je určen pro akcentované karty, ne automaticky pro celou pracovní plochu.

## Ověření a důkazy

- `npm run typecheck`, `npm test` (90 testů / 20 souborů) a build.
- `scripts/ds-library/check-halo.mjs`: skutečné pointer souřadnice, rozdílné transformační matice a parallax, směr obrysu, pressed, focus/Space, zastavení/reset, efekty, lokální akce, disabled/loading, axe v dark/light i obsahových stavech, dynamické reduced motion, touch 390/320 px, text 200 %, reload/Back.
- React Profiler test dokládá nulové dodatečné React commity při pointer pohybu. Test vypnutých efektů dokládá, že se rAF neplánuje.
- Celá existující browser sada zůstává součástí předpublikační i veřejné kontroly. Deset screenshot porovnání ověřuje nezměněné playgroundy proti zachovanému V1.
- `evidence/halo-interactions.json` obsahuje skutečné vypočtené transformace; `halo-*-hover.png`, `halo-*-focus.png`, `halo-*-comparison.png` a mobilní snímky dokládají vzhled.
- Browser evidence je Chromium v automatizovaném prostředí, nikoli fyzický iPhone/Safari. Manuální posouzení estetiky, pohodlí pohybu a fyzického Safari zůstává součástí uživatelského schválení.

## Izolace a publikace

Mění se pouze opt-in knihovní API, registry Cards & Surfaces, tato stránka a její testy/dokumentace. Produkční Header, nástroje, Workspace, Dashboard, Lens 02, Star Border a Colors zůstávají nedotčené. Žádný merge do main.

Preview workflow obnoví **nejnovější ověřený** kompletní Pages artefakt, zkontroluje aktuální publikaci před sestavením i před deployem a nahradí pouze `ds-library-v1-1/`. Každý ostatní soubor musí mít totožný SHA-256. Při novějším souběžném deploymentu se publikace zastaví. `preservation.json` zaznamenává baseline a hash důkazy; veřejná kontrola znovu ověří zachované HTML entrypointy.
