# Dashboard Layout Studio Implementation Plan

**Goal:** Interaktivní návrh pracovní plochy uvnitř stávajícího katalogu.
**Architecture:** Nová registrovaná stránka, čistý reducer volitelných widgetů a lokální editor. Skutečný AppHeader zůstává v rodičovské aplikaci. Office a Notebook stojí mimo odnímatelný seznam. Dvě prostorové kompozice, společné Halo Soft povrchy, bez nové závislosti.
**Tech Stack:** React, TypeScript, existující Design System, Pointer Events, Vitest a Playwright.
**Spec:** Dashboard Layout Studio V1, uživatelské zadání 20. 10. 2026; Dashboard Product Blueprint, Dashboard Widget Library a Decision Log.

## Constraints
- Pouze experiment/ds-library-v1-1 a stávající izolované preview.
- Beze změny Headeru, produkčních nástrojů, Workspace, extension a main.
- Rozložení pouze v paměti; skutečné exporty FindPhraseWidget a MiniQrWidget.
- Priorita 1366 × 768, dále 1440 × 900, 1920 × 1080, tablet/mobil.

## Review focus
- Změna zóny nesmí resetovat rozepsaný widget (stabilní React key a rodič).
- Pointer cancel/Escape nesmí provést nechtěný drop nebo resize.
- Office/Notebook nejsou cíle remove ani resize; reset vrací výchozí rozložení.
- Zvětšené písmo a QR výsledek musí růst bez oříznutí obsahu.
- Publikace obnoví poslední úspěšný celý artefakt a nahradí jen ds-library-v1-1.

## Tasks
- [ ] Model + testy: layout/model.ts, model.test.tsx. Default, kompozice, přidání/odebrání, hranice resize a přesun před cílový widget.
- [ ] Editor: layout/LayoutStudio.tsx, layout/layout.css, LayoutPage.tsx. Sdílené povrchy/ovládání, skutečné widgety, klávesnicová alternativa, transient pointer gesture.
- [ ] Registrace a kompaktní katalog: model.ts, registry.tsx, Library.tsx, catalog.css. Ostatní stránky se nemění.
- [ ] Ověření: typecheck, npm test, built preview, check-layout.mjs a stávající katalogový browser test; screenshoty a axe dark/light, viewporty a stav bez persistence.
- [ ] Report a bezpečná publikace izolovaného preview s kontrolou zachovaných souborů a aktuálního deploymentu.
