# Header rebuild — isolated implementation

Approved scope: C2 behavior and Refined Spatial B character; no production integration or new visual variants. Main baseline: `86e0ff33f00c51e3e56d7b0fd88bb05e06ab6a47`; C2: `5bc0bd8fc6463fa8ad7d8e051e181386da2af486`; B: `f25ab73bfb4f7d1de6bc63215c6247dc91bd29d6`.

## Refinements before implementation

1. Freeze Chromium screenshots and computed interactive paint for C2/B, both themes and 1440/1024/390 widths. Neutral menu-row hover differs from violet active paint; original desktop top-level fill hover is violet. Record measured values, not only CSS variables.
2. Keep the architecture small: AppHeader (composition/layout/actions), Navigation, Popover (state/position/focus), PanelUI (shared surface/heading/row/control), UrlControl, SettingsPanel, plus scoped CSS. No file for every icon or trigger.
3. Every navigation/settings/notification/tab panel uses the same PanelSurface, PanelHeading, PanelRow, icon sizing, type scale, spacing, focus and state tokens. Panel width and content may differ by purpose. Compact and desktop navigation retain their approved active treatments.

## Decisions

- Reuse existing PillNav only in desktop mode with `collapse="never"`; its unmodified animation engine remains the reference. This avoids copying 955 lines into another component. Header owns compact mode and all popup state. No existing production component is changed.
- Floating UI React provides nonmodal portals, focus handling, safe hover paths and positioning. All panels start below the complete header, never flip over its controls; only panel contents scroll.
- Keep native settings selects, style closed controls consistently, reserve arrow space, and respect OS-native option UI.
- Keep PageContextProvider, PreferencesProvider and the extension protocol unchanged. Preview preferences have their own prefix; an isolated Vite transform namespaces the bridge storage constant without changing the production module or touching the production storage key at runtime.
- Separate Vite entry/config and build directory. Preview deployment retains the original labs and adds a new subdirectory. No main push, production deploy or PR for integration.

## Tasks

- [x] Freeze baseline references and verify existing unit tests.
- [x] Test and implement common panel UI, popup state/positioning and C2 navigation.
- [x] Test and implement URL/settings/actions with shared tokens.
- [ ] Exercise the real preview and tools in browser tests, inspect screenshots and computed styles.
- [ ] Run production regression suite/build, independent review, fix important findings.
- [ ] Publish isolated source branch and preview, retain references, report evidence and deviations.

## Acceptance

All six C2 scenarios; same-route close; history; stale hover timers; mouse/touch/keyboard; Escape and outside press; correct focus return; no body scroll lock or workspace shift; no duplicated focus ring; all popup surfaces consistent; native select usable; URL drafts not overwritten; removed focused tab recovers; dark/light; 320–1440 widths and breakpoint edges; short/visual viewport; enlarged text; reduced motion; tool dialogs above header; no changed production sources or original experiments.

Automated commands: unit, typecheck, legacy, tools, production build/browser suite, isolated build and rebuild browser suite. Real Mac/iPhone sign-off remains with the user after preview.
