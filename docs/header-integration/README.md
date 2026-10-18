# Header Rebuild — production integration

Branch: `feat/header-rebuild-integration`; base: main `86e0ff33f00c51e3e56d7b0fd88bb05e06ab6a47`.

The approved C2 / Refined Spatial B header (product source `be2527ca9da9ab56e9fb30c252127a8796e08289`) now replaces the production header in this branch. Its Radix Selects, neutral hover, purple selected states, responsive layout and popup system are retained. No new visual variant was introduced. The isolated preview branch and public preview were not changed.

## Integration and cleanup

- `AppHeader` consumes the existing PreferencesProvider and PageContextProvider. Storage keys, automatic/manual URL selection, extension message protocol, tool registry and tool implementations are unchanged. Navigation restores workspace focus without remounting cached tools.
- Removed the unused `Header.tsx` and eight old globally imported CSS files. Shared document/theme, icon, logo and text-scale styles remain in `base.css`.
- Retained controls used by Header Lab; moved their legacy styles into its lazy-loaded stylesheet, scoped with `:where(.axolotl-header-preview)`. Shared PillNav remains intact.
- The header reserves its measured height once. Workspace no longer adds a second header offset. Extension instructions now describe production use rather than isolated-preview limitations.

## Verification

| Check | Result |
| --- | --- |
| Unit / provider tests | 57 passed, 14 files |
| Legacy tests | 24 passed |
| Tool and extension/bridge regression | 335 passed |
| TypeScript and production build | Passed |
| Local Chromium application suite | 43 passed |
| Chromium / WebKit / Firefox CI | 129 passed (43 per engine); [completed regression run](https://github.com/irisKaX/axolotl-2/actions/runs/39081723026), final commit checks and summary in [PR #3](https://github.com/irisKaX/axolotl-2/pull/3) |
| Header Lab A/B, dark/light | Identical computed styles and control dimensions in 8 states against main |
| Standalone Header Lab artifact checks | Passed; corrected a stale grid assertion which also failed on unchanged main |
| Independent whole-branch review | Completed; fixed the single finding (portable Playwright executable selection) |

The 43 browser scenarios per engine cover all ten tool routes in both themes, retained tool state, QR output decoded back to the committed header URL, actual WebP conversion and comparison, tool-dialog layering, history/same-route navigation, extension target propagation into metadata audits, preferences and URL persistence, reconnect/tab removal, popup dismissal, keyboard/touch, Radix typeahead and nested Escape, scroll-lock cleanup, reduced motion, enlarged text, and widths from 320px through desktop. Axe scans cover every header panel and settings view in both themes.

Browser tests use the real built application entrypoint and real providers. The extension fixture implements the existing postMessage protocol and exercises the real audit runtime; it is not an installed-extension end-to-end session. Unit/tool tests cover extension background/content behavior separately. The user's previous successful physical Mac/iPhone validation applies to the approved isolated header; this integration adds automated Chromium/WebKit/Firefox coverage, not a new physical-device claim.

## Visual evidence

Key production-entry screenshots are in [screenshots](screenshots/). Frozen approved palettes are in [references.json](references.json). Baseline and integration Header Lab screenshots plus measured styles are in [lab-comparison](lab-comparison/).

The lab comparison can be repeated with a main build served at port 4185 and the integration build at port 4173:

```sh
node scripts/header-integration/compare-lab.mjs
```

`REFERENCE_URL`, `INTEGRATION_URL` and `PLAYWRIGHT_CHROME_EXECUTABLE` override these defaults. The normal Playwright configuration uses its installed browsers, including on macOS.

| State | Dark | Light |
| --- | --- | --- |
| Desktop | [Header](screenshots/dark-1440-closed.png) | [Header](screenshots/light-1440-closed.png) |
| Desktop Radix Select | [Select](screenshots/select-dark-1440-theme.png) | [Select](screenshots/select-light-1440-theme.png) |
| Mobile Radix Select | [Select](screenshots/select-dark-390-theme.png) | [Select](screenshots/select-light-390-theme.png) |

Additional evidence: [active mobile navigation](screenshots/dark-390-active-route.png), [desktop audit menu](screenshots/dark-1440-group-audit.png), [tool dialog above header](screenshots/dark-1440-tool-dialog.png).

## Risks and rollback

- Floating UI is a new runtime dependency; Radix Select was already present. Version pins and lockfile are committed. Popup focus guards retain the approved accessibility shim until upstream exposes labels directly.
- Scoped legacy styles intentionally remain for Header Lab. Removing those components would break the preserved experiments.
- No preference migration or extension change is needed. Before merge, rollback means closing the PR. After a separately approved merge, revert the integration PR through another reviewed change; existing storage remains readable by the original header.
- This branch and PR do not deploy. The deployment job remains restricted to a non-PR run on `main`. No merge or production deployment is authorized by this preparation.
