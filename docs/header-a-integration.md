> HISTORICAL: renderer archived by Core Cleanup; current authority: [Library V1.1](ds-library/CONSOLIDATION.md). Restore source at b4ceef74af60ac12b6b4420917f1ece9c2658b64.

# Approved header A integration — 2026-10-16

Iris selected variant A from the reviewed live catalog. Integrate its appearance
and working controls into Header; preserve the left PillNav, tools and browser bridge.
No commit, push or deployment is part of this local preparation.

1. Extract the catalog controls and styles into a shared HeaderControls component.
   Keep the exact A appearance; B remains available in the catalog.
   Header owns the shared open menu ID, preserving mutual exclusion with navigation.
2. Replace the old right-side controls and adapt only header layout/spacing.
   Preserve production preference storage, settings, current tab and URL operations.
   Check focus, reduced motion, mobile menu stacking and 1366 px geometry.
3. Run React tests, build and a fresh code review. Do not claim real-browser
   or installed-extension verification unless performed.

Progress:
- Existing isolated worktree: feat/header-controls-catalog. Prior catalog edits retained.
- New regression: notifications are usable and cooperate with navigation/settings;
  old header has a disabled notification button.
- Regression observed failing on disabled bell, then passing after integration.
- Controls extracted with unchanged A palette/geometry and production preferences.
  Both App and catalog tests passed (19/19).
- Layout uses a fixed header grid, 382px controls, up to 680px left navigation,
  24px column gap, and stacks below 850px. Dropdown height is viewport-limited.
- Final validation: React suite 45/45 passed; TypeScript/Vite build passed;
  git diff --check passed; extension, tools and browser bridge have no diff.
- Fresh review found no important/critical issues. Its 7px mobile spacing
  discrepancy was aligned with the approved catalog by removing an unnecessary
  minimum navigation height. No browser rendering or installed-extension test
  was available; do not treat source review as visual verification.
- Ready locally. No commits, pushes or deployments performed.

## Follow-up: connected navigation

Iris requested URL on the same row and the whole navigation connected.
The approved glass material now wraps the left navigation, URL and controls.
At desktop widths including 1366px all three groups share one row; below
1100px of header space PillNav collapses, and below 680px the controls wrap
within the same surface. URL precedes notifications in the DOM and Tab order.
Full A catalog previews share the exact layout; the original A/B swatches remain
for reference. `node scripts/preview-header-catalog.mjs --connected` exports
a focused interactive review file. No deployment is authorized by this change.

Validation: keyboard-order regression failed before the DOM reorder, then passed.
Fresh source review identified the widened mobile panel's animation origin;
the 320px-panel regression failed before correcting its clip to the toggle's
actual offset. Normal 96px panels retain their existing animation origin.
Build, React tests and focused HTML execution are checked separately from visual
browser verification, which remains unavailable in this environment.

## Screenshot correction: one row and violet styling

The user's screenshot showed the delivered HTML incorrectly wrapping controls
onto a second row. Its packager had concatenated every CSS file from dist/assets,
including historical files copied from public/assets. An old catalog rule replaced
the connected header's three columns with two. Packaging now follows the current
Vite manifest's app and HeaderLab imports only. The SVG data URL also contained raw
quotes inside a quoted CSS url(), so the logo became a square; preview SVGs now use
base64 URLs. These are delivery bugs, not a request to redesign the approved layout.

The connected controls now use the left navigation's tile material, rim and 36px
button height, with the same solid #7c3aed fill and white ink on hover/open states.
URL shares that tile material; the theme thumb uses violet with white sun/moon marks.
The desktop order remains navigation → URL → clock/actions on one row.

Verification: both delivered-HTML regressions failed against the previous export
(two-column override and malformed logo URL) and pass after repackaging. React suite
48/48, artifact checks 2/2, TypeScript/Vite build and diff checks pass. Browser geometry
assertions were added for later execution; browser rendering remains unverified.
No commits, push, deployment, extension changes or tool changes were made.

## Publication approval

On 2026-10-16 Iris explicitly requested deployment to
https://iriskax.github.io/axolotl-2/. The previous no-publication restriction
is superseded for this reviewed header. The release is based on current main
8ba04179004ed5d05289a40ac8977ad6685d6648; source and root Pages build are kept
in sync. Local checks: React 48/48, legacy 24/24, tools 335/335, preview 2/2,
build and publish:check passed. Run existing GitHub browser CI before moving
main to the release commit; retain the worktree for follow-up work.
