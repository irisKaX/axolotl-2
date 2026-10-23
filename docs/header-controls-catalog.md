> HISTORICAL: renderer archived by Core Cleanup; current authority: [Library V1.1](ds-library/CONSOLIDATION.md). Restore source at b4ceef74af60ac12b6b4420917f1ece9c2658b64.

# Header controls: isolated A/B catalog

The initial A/B prototypes did not change production `Header.tsx`.
On 2026-10-16 Iris approved A; the local production header now uses the same
shared `HeaderControls` component as the catalog. Extension sources, tool runtime
and tool logic remain unchanged. No commit, push or deployment has been performed.

## Open the catalog

Run the existing development workflow and open
`/axolotl-2/app.html?catalog=headers#design-system`, or select **Hlavička · A/B** in the design catalog.
For a built preview, use `/axolotl-2/?catalog=headers#design-system`.

- A: Unified Floating Controls, shared pill with a separate matching URL capsule.
- B: Spatial Command Bar, separate floating controls with bounded pointer lighting.
- Both are shown side by side in dark and light, with independent persisted preview preferences.
- Full-header workbench: 1440, 1366, 1024, 768 and 390 CSS pixels; fit-to-preview or actual size.
- Actual existing Settings and UrlPicker components are reused. Optional ID prefixes avoid duplicate labels and ARIA targets; production defaults are unchanged.
- Shared cursor geometry now accounts for scaled preview surfaces; unscaled behavior is covered by a regression test. Other shared changes only add opt-in preference scopes and export the existing PillNav palette.
- PageContext remains shared and real. No fixture browser tabs or notification messages exist in the implementation.
- Notification button opens an honest empty panel. There is no notification data service in the current project.
- Existing disabled settings remain disabled; no new backend capabilities are implied.

## Local single-file review

```sh
npm run build
node scripts/preview-header-catalog.mjs
```

Open `dist/header-catalog-review.html` in a browser. It includes React, CSS and the logo, without CDN dependencies.
Theme/settings, menus, clock, manual URL and width controls are live. Navigation links open the actual application.
The existing extension only authorizes the hosted Axolotl URL. Downloaded files and localhost cannot enumerate its tabs;
the preview explicitly shows the disconnected state and uses the real manual-URL operations instead.
The catalog route reuses the existing bridge without changing extension permissions or authorization.

## Validation

`npm test` and `npm run build` cover production regressions, scoped preference storage, unique IDs,
real manual URL propagation, a mocked extension response, menu focus, notifications,
workbench themes, scaled pointer coordinates and reduced motion. Existing browser suites are not substitutes for checking
the new variants in a real browser; no new browser run was available in this environment.

Before selecting a final variant, check real dropdown placement, touch, zoom, the 1366 px composition
and installed-extension tab selection at the authorized URL. This task does not publish that route.
