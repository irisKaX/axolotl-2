# Tools migration Implementation Plan

> For agentic workers: Execute the independent bridge and presentation work in parallel, with integration and final verification by the main worker.

**Goal:** Převést deset původních nástrojů do současné aplikace bez office.
**Architecture:** Zachovat modely a kontroléry; přizpůsobit transport, host a sdílené UI. Samostatné rozšíření zprostředkuje privilegované operace.
**Tech Stack:** React, Vite, TypeScript, existing JavaScript modules, Manifest V3.
**Spec:** ../specs/2026-10-15-tools-migration.md

## Global Constraints
- Zachovat header a prázdnou plochu office.
- Žádné falešné výsledky; čitelné chyby bez připojení.
- Aktuální design tokeny pro oba motivy.
- Původní analýzy a exporty zachovat včetně limitů a zrušení.

## Review Focus
- Změna karty během skenu nesmí zobrazit zastaralý výsledek.
- Chybějící nebo staré rozšíření musí skončit srozumitelně.
- Pozdní odpovědi a události nepatří jinému nástroji nebo relaci.
- Exporty, workery a WASM fungují pod cestou /axolotl-2/.
- Původní styly nesmí zasáhnout header a světlý motiv.

### Task 1: Extension bridge
Files: browser-extension/**, src/tools/transport.*, bridge tests.
Interfaces: request(operation,payload,target) with target {tabId,url}; AXOLOTL_TOOL_REQUEST / AXOLOTL_TOOL_RESPONSE correlated by requestId, AXOLOTL_TOOL_EVENT carrying event. Same-origin checks on both sides; allowlisted operation names; per-dashboard sessions.
- [x] Test unsupported sender, invalid target, request correlation and cancellation.
- [x] Implement privileged operations using original background modules and bounded network transport.
- [x] Package updated extension and test.

### Task 2: Tool host and runtime
Files: src/tools/ToolWorkspace.tsx, src/tools/registry.*, src/tools/legacy/**, src/app/App.tsx, build scripts.
Interfaces: existing mount(root,app) lifecycle; app.request, target, ensureTarget, lock, unlock, toast, run, refreshTarget. Tool roots persist while hidden.
- [x] Test actual tool headings, local state persistence and disconnection errors before wiring routes.
- [x] Copy original runtime modules, adapt worker/download/network operations, connect target lifecycle.
- [x] Run integration and original model/controller tests; build all chunks and assets.

### Task 3: Presentation and release
Files: src/styles/tools.css, legacy shared UI, documentation, generated build.
- [x] Use current design tokens for tool panels, buttons, forms, results and portals; remove old decorative stages.
- [ ] Inspect dark/light layouts and long results.
- [x] Run complete test suite, typecheck, publish:prepare and publish:check.
- [ ] Review diff, fix substantive findings, publish to existing GitHub Pages and verify deployment.

## Verification before deployment

- Vitest: 28/28 passing; original app suite: 23/23 passing; migrated tools and bridge suite: 334/334 passing.
- Production typecheck/build and root-to-dist artifact comparison pass.
- Independent review found target-switch cancellation and stale picker events; both fixed with regression coverage.
- Extension browser operations are tested through backend/transport harnesses. Real installation in a user browser remains necessary for live privileged operations.
