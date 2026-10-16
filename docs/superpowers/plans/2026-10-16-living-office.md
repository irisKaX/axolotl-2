# Living Office Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task; independent scheduler and dashboard integration tasks may be delegated.

**Goal:** Ship the approved Creative Studio office as a living theme-aware dashboard scene.

**Architecture:** Layer generated local scenery behind independently animated transparent character sprites. A deterministic activity scheduler and visibility-aware clock drive walking, working and drinking; the existing PreferencesProvider controls lighting and motion.

**Tech Stack:** React, TypeScript, CSS, Vite, Vitest, Playwright; no new runtime dependency.

**Spec:** docs/superpowers/specs/2026-10-16-living-office.md

## Global Constraints

- Four clothed axolotls, three desks plus working beanbag, no baked duplicate characters.
- Preserve approved Brumlovka/Filadelfie exterior and exclude Gamma/O2 outside.
- Existing theme/motion preferences, no reset on theme change; hidden/reduced motion pauses.
- Dashboard only, no page overflow at 1366x768; existing navigation unchanged.

## Review Focus

- Hidden tab and offscreen scene resume without elapsed-time jump.
- Reduced motion is respected on first mount and when changed mid-walk.
- Switching routes disposes clocks and does not fetch new office images on non-dashboard routes.
- At most one walking visitor; their desk sprite is absent until return.
- Narrow/large-text viewports keep header and pause control usable.

### Task 1: Activity scheduler and clock

**Files:** src/components/office/office-activity.ts, useOfficeClock.ts, office-activity.test.ts, useOfficeClock.test.tsx.

**Interfaces:** sampleOffice(elapsedMs:number): OfficeSnapshot, with actors {id: 'front'|'back'|'right'|'lounge', activity:'work'|'sip'|'walk'|'coffee'|'window'|'laptop', frame:number, routeProgress:number, destination:'coffee'|'window'|null, away:boolean}; useOfficeClock({paused:boolean}) returns {elapsedMs, running, ref}.

- [x] Test initial working state, finite/negative times, one visitor, outbound/return continuity, return to desks, varied actors/destinations.
- [x] Implement deterministic activity schedule and <=12fps active-time clock.
- [x] Verify clock stops while paused, hidden or offscreen, resumes continuously, cleans up on unmount.

### Task 2: Scene assets and rendering

**Files:** src/components/office/LivingOffice.tsx, LivingOffice.css, assets under src/components/office/assets/, LivingOffice.test.tsx.

**Interfaces:** named export LivingOffice with no required props. Uses existing usePreferences and Task 1 interfaces. Accessible region name 'Axolotlí office'.

- [x] Generate a character-free day/night environment matching the approved board, transparent seated/work/drink and walk/stand sprite sheets; optimize format without altering art.
- [x] Implement separate actors, furniture occlusion, walking routes, lamp/monitor atmosphere, theme blending and bottom fade.
- [x] Add accessible pause control and reduced-motion static state; cover theme and pause behavior with tests.
- [x] Inspect screenshots and moving scenes at desktop/mobile; fix clipping and scale.

### Task 3: Dashboard integration

**Files:** src/app/App.tsx, src/app/App.test.tsx, src/styles/dashboard-layout.css, tests/browser/navigation.spec.ts, tests/browser/office.spec.ts.

**Interfaces:** lazy-load named LivingOffice export only on dashboard inside retained #axolotl-office-slot. Keep slot dimensions stable while loading.

- [x] Replace obsolete empty-slot tests with visible-office and route lifecycle assertions.
- [x] Integrate lazy scene and responsive slot sizing, preserving navigation.
- [x] Browser-test theme switch, pause/reduced motion, real actor movement and no overflow.

### Task 4: Review and release

- [x] Run npm test, npm run build, relevant browser checks; independent code review.
- [x] Prepare root Pages output with npm run publish:prepare and validate publish:check.
- [ ] Publish verified source/assets/build to main with expected SHA lease.
- [ ] Verify deployed HTML/assets and live office behavior before reporting completion.
