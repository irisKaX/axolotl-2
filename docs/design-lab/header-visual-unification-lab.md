# Header Visual Unification Lab

Status: **visual exploration, not approved for production**. 17 October 2026.
Interaction baseline C2 is approved by Iris on Mac and iPhone. That approval
is preserved; it does not approve any of the visual studies below.

## Intent and boundary

The left PillNav defines the visual language. Right controls inherit its
pill geometry, graphite/lilac material, violet active state, rim and optical
weight. This is a header study, not a dashboard or application redesign.

Source: `irisKaX/axolotl-knowledge/Design Lab.md`, reviewed at its
17 October 2026 20:35 UTC revision: Header Design Review 02/03, Header Visual
Direction and approved C2 behavior plus user test results.

New entry: `header-visual-lab.html`. Source branch:
`feat/header-visual-unification-lab`, based on
`5bc0bd8fc6463fa8ad7d8e051e181386da2af486`.
Original Responsive Lab A/B/C/C2 files are unchanged. No production/main edits.
Deployment uses the existing, authorized `preview/header-responsive-lab`
branch of `axolotl-preview`, with a pinned source commit; no permission,
environment protection or Pages configuration changes.

## Browser audit: evidence before design

Read sources: PillNav.tsx/CSS, HeaderControls.tsx/CSS, header-layout.css,
navigation.css, design-tokens.css, UrlPicker, useDisclosure and C2 Scene/CSS.

Computed styles and bounding boxes were measured in Chromium, not inferred
from source declarations. The initial pre-regression result is in
[header-visual-computed.json](header-visual-computed.json). For the corrected
interactive navigation states, see the regression audit below.
Reproduce with:

```sh
PLAYWRIGHT_CHROME_EXECUTABLE=/path/to/chromium node scripts/audit-header-visual.mjs /tmp/axolotl-header-audit
```

The command starts local Vite, measures 24 scenes (C2 and A/B/C × dark/light
× 1440/1024/390), captures real CSS including pseudo-surfaces, expanded
notification/settings states and URL focus, and writes screenshots + JSON.
It does not contact or modify production.

### Reference C2 measurements (CSS px, same in dark/light)

| Element | 1440 | 1024 | 390 |
| --- | --- | --- | --- |
| Navigation item / Menu height | 36 | 44 | 44 |
| URL height | 36 | 36 | 44 |
| Bell/settings hit region | 44 × 36 | 44 × 36 | 44 × 44 |
| Theme hit region | 60 × 36 | 60 × 36 | 60 × 44 |
| Theme visible track | 60 × 36 | 60 × 36 | 60 × 36 |
| Header height | 68 | 126 | 120 |
| Clock | 122 × 37 | 122 × 37 | hidden |

Many neutral surfaces already share the same PillNav gradient and 999 px
radius. The problem is not that every existing color differs: it is mainly
inconsistent scale, visual weight and state ownership. For example, compact
Menu is 44 px next to a 36 px URL, while the visible icon surface almost fills
its hit region. HeaderControls also owns separate panel/hover color roles.
A small optical button need not have a small clickable target.

Stacking audit: C2 header z20; bar z2; overlay z1; workspace z0 and isolated.
The panel is a sibling of the blurred bar, so it is not clipped by its
backdrop-filter context. `overflow:auto` belongs to the overlay only; header
and bar retain visible overflow. All visual variants keep this arrangement.

## Three design hypotheses

| Study | Material and hierarchy | Advantage | Tradeoff / risk |
| --- | --- | --- | --- |
| A — Precision PillNav | Shared satin carrier; 44 px navigation and URL; 32 px secondary surfaces inside 44 px targets | Quietest hierarchy; exact common alignment | Least spatial character; small glyphs need readability review on real hardware |
| B — Refined Spatial PillNav | 48 px primary controls; raised pills; recessed URL; directional light on opaque glass base | Clearest depth hierarchy between actions and context | More height/weight; blur has a rendering cost, opaque base remains usable without it |
| C — Experimental PillNav | Independent navigation, URL and control capsules; outline actions; capsule light edge; restrained icon turn on mouse interaction | Strongest personality while retaining PillNav geometry | More accents, less continuous carrier; light-state contrast needs explicit regression coverage |

C is deliberately a different material composition, not a recolor. All three
use the same semantic palette roles. No looping decoration or pointer
tracking is introduced. Reduced motion removes CSS transitions; the original
PillNav receives the existing reduced-motion preference.

### Preliminary tokens (lab only)

Single registry: `src/pages/header-visual-lab/design.ts`. Semantic roles:
`ink`, `muted`, `base`, `raised`, `lower`, `edge`, `hover`, `accent`, `focus`.
They map to `--vu-*`; the scoped adapter maps them into the right header
controls only. The scene and left PillNav keep their original theme palette. `!important` is limited to this token bridge because
production components supply their own inline theme variables. It does not
change those components or their public APIs.

| Role | A | B | C |
| --- | --- | --- | --- |
| Primary navigation height | 44 | 48 | 44 |
| URL height | 44 | 48 | 44 |
| Secondary visual surface | 32 | 38 | 34 |
| Secondary hit region | 44 | 44 | 44 |
| Icon glyph | 17 | 18 | 17 |
| Theme track | 54 × 30 | 60 × 36 | 64 × 32 |
| Theme hit region | 62 × 44 | 68 × 44 | 72 × 44 |
| Navigation rhythm | 8 | 12 | 8 |
| Panel radius | 24 | 28 | 24 |
| Control response duration | 160 ms | 220 ms | 180 ms |

Common: pill radius999; focus outline2; minimum44 px main control targets;
white active ink on violet; C2 active item ✓ plus `aria-current=page`.
Theme switch remains a native checkbox with an accessible name.
Desktop1181–1300 uses narrower horizontal gaps/padding to retain full PillNav.
Compact threshold1180, one-column group layout680, clock hiding520 remain C2.
On mobile the URL input remains16 px, avoiding unwanted input zoom on iOS.

Text token contrast is tested at ≥4.5:1 (primary/muted vs base, muted vs
raised and white vs accent). This is targeted coverage, not a claim of a
complete WCAG certification. Actual open icon pseudo-surfaces are also
tested: review caught a C-light cascade collision that left white icons on
a transparent surface; it was reproduced by a failing test and corrected.

## Implementation and maintainability

- `VisualScene` is a small, isolated C2 scene adapter. It reuses the exact
  approved `CompactNavigation` and `WideNavigation`, real HeaderControls,
  UrlPicker, settings, preference store and ToolWorkspace.
- The adapter owns scene routing/focus/layout orchestration so the original
  lab source stays untouched. If a study is selected later, consolidate this
  orchestration with C2 as a separate reviewed extraction; do not ship two
  production implementations.
- Shared preview context has three real tool links. Selecting one renders
  the actual tool; it does not invent results, notifications or extension data.
- Styles are scoped to `.vu-scene` / `.vu-lab` and imported only by the new
  entry point. Production does not import the registry or visual CSS.
- Preferences use `axolotl-visual-lab-*`; production and Responsive Lab settings
  are separate. The outer lab theme selector sets iframe themes; each inner
  theme toggle can then be explored independently.
- Side-by-side mode uses three real iframes. Their CSS viewport widths are
  independent of the display scale. Scaling is labelled; switch it off or
  open standalone for native-size touch/legibility evaluation. Resizing keeps
  current iframe state. Changing global theme/context intentionally reloads it.
- URL query stores visual selection, width, theme and comparison mode.

## Verification

- TypeScript and production build pass with the additional HTML entry.
- All **50 unit tests** pass.
- All **56 browser tests** pass: original31 plus new25.
- New coverage: side-by-side geometry, actual iframe widths, dark/light,
  12 breakpoint boundaries per variant/theme, hit regions, URL space,
  navigation clipping, active states, all C2 accordion rules, same-route
  dismissal, history, keyboard, touch, outside clicks, Escape and focus,
  URL entry, notification/settings/tab controls, theme switching,
  short-panel scrolling, motion/reduced motion, zero workspace shift and
  actual overlay hit-testing above content.
- Browser screenshots reviewed for wide/compact/mobile, dark/light and all
  three distinct material systems. Independent code review completed; the
  important light-mode contrast finding is fixed and regression-tested.
- Automated browser execution is Chromium; these new visual variants still
  need Iris's visual assessment on Mac and physical iPhone. No variant is
  considered selected or approved by these tests.


## Visual regression correction — 17 October 2026

Source: live knowledge `Design Lab.md`, revision 21:06 UTC, including the
user-reported Header Visual Unification Lab regression. This correction is
limited to reference consistency, not another creative iteration.

### Root cause and measured differences

The global lab adapter overrode the scene AND PillNav palette with `!important`,
including `--pn-row-hover = color-mix(accent 16%, base)`. It also replaced text,
active ink, focus, tile/rim and edge tokens. Additional selectors turned compact
rows into full pills, filled expanded groups permanently, and changed desktop
submenu active rows from the reference tint to solid purple. C added an active
light stripe and a new logo surface. These were unintended reference changes.

| Actual painted state | C2 reference / corrected A/B/C | Before correction |
| --- | --- | --- |
| Compact row/group hover, dark | rgba(255, 255, 255, 0.06) | accent 16% + dark base |
| Compact row/group hover, light | rgba(24, 24, 27, 0.05) | accent 16% + light base |
| Compact active row, both themes | #7c3aed, white ink, original checkmark | light changed to #7130dc |
| Compact expanded group, no hover | transparent | permanently tinted |
| Compact row radius | 12 px | 999 px |
| Desktop submenu hover | original neutral settings-border role | background unchanged, text/radius changed |
| Desktop submenu active row | original 18% violet tint, original text | solid violet, white text, added checkmark |
| Desktop top-level fill hover/active | #7c3aed, original rolling animation | light changed to #7130dc |

**Important reference distinction:** C2 already has violet *top-level desktop*
fill hover (`hoverEffect="fill"`). Its compact menu hover is neutral. The fix
preserves both genuine reference behaviors instead of silently redesigning
the desktop interaction based on the compact-menu description.

### Repairs and preserved differences

- Removed palette bridge from scene and PillNav; retained it only for right controls.
- Restored reference text, tile gradients/rims, edges, focus colors/offsets,
  compact Menu surface, close button, submenu colors/radii and active treatment.
- Removed the permanent expanded-group fill, C active stripes, added desktop
  checkmark, C logo surface and fixed-size desktop logo-link override.
- Split right-control hover from expanded styling. Neutral hover uses the C2
  role; expanded controls retain violet/white contrast. Existing hover-to-open
  behavior is unchanged (an already open control correctly uses expanded paint).
- Preserved study dimensions, gaps, outer carrier/panel materials, URL treatment,
  right control sizes, C capsule composition and existing microinteractions.
- No React interaction code, C2 files, production files, routes, overlay positioning,
  stacking/overflow or breakpoint rules changed.

### Repeatable checks

`tests/browser/pillnav-reference.spec.ts`: eight added tests compare real
computed tokens and painted states against the untouched C2 entry in dark/light
at 1440, 1024 and 390 px, across all A/B/C. They check idle, hovered, active,
expanded and keyboard-focus states, plus actual icon pseudo-element surfaces
and closed-hover versus expanded controls. Fixed hover/active token assertions
also prevent a reference-and-study change hiding the same regression.
The first compact reference test failed before the CSS fix on the actual purple
paint, token drift, radius, text and focus differences (red/green reproduction).

Reproduce the 24-scene browser audit (screenshots + JSON):

```sh
PLAYWRIGHT_CHROME_EXECUTABLE=/path/to/chromium node scripts/audit-pillnav-regression.mjs /tmp/axolotl-pillnav-audit
```

[header-pillnav-regression.json](header-pillnav-regression.json) records before
and after computed styles. The before snapshot is source `2937dd5`; the after
snapshot is this correction. Browser screenshots were inspected in both themes.
