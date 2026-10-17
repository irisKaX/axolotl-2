# Header Responsive Lab / Study 01

Status: experimental; no variant approved. Source baseline: `86e0ff3` (includes the merged touch disclosure repair, PR #2).

## Brief and boundaries

Review `Design Lab.md` / Header Design Review 01 in `irisKaX/axolotl-knowledge` identified a stretched compact navigation container and a panel anchored at `top: 0`, partially covering the logo. This Lab compares three spatial answers. It preserves the header material, violet selection, O2 mark, production controls, route definitions and production `useDisclosure` touch handling.

Production navigation and the old header studies are not edited. A separate Vite HTML entry is added, with all experimental CSS scoped to `hr-*` classes. There are no added project dependencies. This branch must not be merged into main as an approved redesign.

## Open

- Lab: `header-responsive-lab.html`
- Standalone scene: `header-responsive-lab.html?view=scene&variant=A` (also B, C)
- Light scene: append `&theme=light`
- Local: `npm ci`, `npm run dev -- --host 127.0.0.1`, then `/axolotl-2/header-responsive-lab.html`

## Three interaction models

| Variant | Composition | Strength | Cost / technical risk |
| --- | --- | --- | --- |
| A Brand Dock | Logo then hamburger, fixed 104px dock. Dropdown below entire header, anchored to the dock. | Short travel; header controls stay accessible. | Overlays workspace; requires bounded scrolling and anchor placement. |
| B Side Drawer | Hamburger then logo. Native modal dialog below header, own scrolling column. | Clear navigation mode, touch targets, room to grow. | Background inert until dismissal; focus cycle and scroll locking required. |
| C Command Shelf | Logo + controls on first row. Menu/current section + URL on second. In-flow shelf of categories. | No content occlusion; overview of tools. | More height and content displacement; must be assessed against future dashboard constraints. |

Above 1180px the original PillNav configuration is shared, with Lab-local route state. At 1180px and below the variants diverge. At 680px and below URL/layout are adapted for mobile. Below 521px the clock is hidden to preserve usable brand, navigation and right controls. Each breakpoint is exercised at its boundary.

The Lab uses real iframes: changing their CSS width changes `innerWidth`, media queries and container queries. Fit mode only scales presentation. For realistic touch targets use 100% or the standalone scene. Compare mode stacks three independent interactive scenes at the same width. Width changes preserve scene state until the wide/compact boundary; a theme preset reloads scenes. Scene settings use separate `axolotl-responsive-lab-*` preference prefixes.

## Functional scope

- Original URL picker, clock, notifications, Settings and theme toggle.
- Original route definitions and actual tool screens on selection; navigation stays within the preview iframe.
- The neutral dashboard study text is review context, not a dashboard/Office redesign.
- Compact categories use native disclosure buttons, links and `aria-expanded`/`aria-controls`; no hover dependence.
- Escape restores focus, outside pointer closes, Tab exits nonmodal panels, arrows/Home/End navigate visible actions.
- B uses native `dialog.showModal`, a Tab/Shift+Tab boundary loop, close button and scroll lock. Focus restoration waits for React to remove the inert dialog background.
- C displays categories together; categories can collapse independently. On mobile it becomes a scrolling single-column document.
- Reduced motion honored through media preference and existing Settings.
- Manual URL works; real browser tabs and remote page audits still require the extension on an allowed origin. No fabricated tabs or notifications.

## Validation

Executed in a headless Chromium browser and Node 24:

- `npm test`: 50 passing.
- `npm run test:legacy`: 24 passing.
- `npm run test:tools`: 335 passing.
- `npm run build`: TypeScript + production Vite build successful.
- `npm run test:browser`: 15 passing, including 11 new Lab tests and the 4 existing browser tests.
- Browser geometry at 320, 390, 520, 521, 680, 681, 721, 768, 1024, 1101, 1180, 1181, 1366, 1440px.
- Touch events exercised with a touch-enabled mobile browser context, including the 150ms pointerleave regression interval.
- Visual inspection of open A/B/C panels at desktop and mobile sizes. No horizontal document overflow in the tested sizes.

This is Chromium emulation, not a claim of physical Mac/iPhone or Safari validation. Final ergonomic and visual choice belongs to Iris after testing.

## Deployment boundary

Use the existing `irisKaX/axolotl-preview` GitHub Pages environment and a preview-only branch workflow, checking out the exact reviewed source commit. Neither repository's main branch is modified. Production Pages deploy is gated on main and is not triggered by this feature branch. Do not create another repository or change hosting permissions to make deployment work.
