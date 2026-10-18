# Header Rebuild production integration — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Replace the production header with the approved C2 / Refined Spatial B header, preserving application behavior, and open a PR without merging or deploying.

**Architecture:** Use the existing PreferencesProvider and PageContextProvider without storage migrations. Import the approved header component system from `a210ade`; adapt preview-only extension copy to production. Keep legacy controls required by Header Lab, but isolate their CSS to the lab so loading it cannot alter the application header or workspace.

**Tech Stack:** React 19, TypeScript, scoped CSS, Floating UI 0.27.20, Radix Select 2.3.8, Vitest, Playwright, axe.

**Spec:** User approval of final Header Rebuild and Radix Selects, including successful manual Mac/iPhone checks; integration instructions in this conversation. Approved source: `be2527ca9da9ab56e9fb30c252127a8796e08289`, test refinements `c3f9f5e7486697332ee9bb4b5798dab95bf36c53`.

## Global constraints

- Separate branch `feat/header-rebuild-integration` based on main `86e0ff3`.
- No merge, production deploy, extension protocol change, storage-key migration or redesign.
- Preserve tools, workspace, settings, URL, browser extension and existing experiments.
- Keep source preview branch and its public deployment unchanged.

## Review focus

- Loading Header Lab must not alter production header geometry or paint; compare computed styles before and after lazy loading.
- Stored production preferences and URL must be read and written under existing keys; never import preview namespaces.
- Navigation to the same route and browser history must close menus and move focus without remounting tool runtime.
- Nested select Escape, focus, mobile viewport and scroll locks must remain correct inside real app providers.
- Extension reconnect, selected-tab removal and manual URL editing must keep the same target for every tool.

### Task 1: Integrate approved header with production providers

**Files:** `src/app/App.tsx`, `src/app/header/*`, `src/app/HeaderIntegration.test.tsx`, `src/app/App.test.tsx`, `package.json`, `package-lock.json`.
**Interfaces:** AppHeader consumes `route: string`, `onNavigate: () => void`; providers and stores keep existing interfaces.

- [x] Add a failing app-level nested select / persistence test; run it against the old header.
- [x] Port approved header and dependency versions; mount it in App and restore workspace focus on navigation/history.
- [x] Replace preview-only extension wording with production instructions; preserve bridge/download URLs.
- [x] Update old header-specific unit interactions to the approved contract without dropping application assertions.
- [x] Run all unit tests and typecheck; commit the integrated application.

### Task 2: Retire conflicting production CSS while preserving labs

**Files:** `src/styles/app.css`, new `src/styles/base.css`, legacy header styles, `src/app/Header.tsx`, `src/app/useDisclosure.ts`, lab imports.
**Interfaces:** Base CSS owns document/theme/text-scale/icon utilities; AppHeader owns measured top space; lab styles apply only inside `.axolotl-header-preview`.

- [x] Add browser checks for one measured workspace offset and no style changes after Header Lab loads.
- [x] Remove unused Header; move its disclosure type to the shared legacy hook.
- [x] Extract shared base utilities, remove obsolete workspace offsets, scope retained legacy styles to Header Lab.
- [x] Check all remaining consumers before removing files; preserve shared PillNav and tool styles.
- [x] Verify labs and app in dark/light and responsive widths; commit cleanup.

### Task 3: Full regression, review and PR

**Files:** `tests/browser/*`, `tests/header-integration/*`, Playwright config, verification workflow, `docs/header-integration/*`.
**Interfaces:** Tests run the real built production entrypoint at `/axolotl-2/`; extension tests use the existing message protocol.

- [x] Reuse approved header/select behavioral coverage with production URLs/storage keys; add all-tool route, QR, conversion, audit-result and provider/extension checks.
- [x] Run unit, legacy, tool/bridge tests, typecheck/build and browser suites. Run Chromium locally and Chromium/WebKit/Firefox in non-deploying CI.
- [x] Capture key dark/light desktop/mobile screenshots and record exact results, limitations and rollback.
- [x] Request a fresh whole-branch review; resolve material findings with regression tests.
- [x] Push only the integration branch and create PR against main. Verify deployment jobs are skipped. Do not merge.

Final CI results and deployment-skip verification are recorded in [PR #3](https://github.com/irisKaX/axolotl-2/pull/3). The complete three-engine run passed 129 scenarios. A final test-only synchronization refinement additionally waits for Radix focus restoration before opening the next choice.
