# Button Studio 01 — experiment, not approved Design System

Isolated React/CSS study for selecting an Axolotl button family. No application routes, production styles, header, existing previews, dependency manifests or lockfiles are changed.

## Families
- **Milled:** defined shoulders, inset machined rim, two-pixel mechanical travel.
- **Lens:** optical capsule, separate icon lens, lifted highlight and soft compression.
- **Rail:** square graphic key, monospace typography, independent action compartment and structural offset.

Shared API: family, variant (primary/secondary/ghost/icon/destructive), size (s/m/l), native disabled, aria-busy loading, theme, optional star/color/duration. Blue #0050FF signals primary action. Violet #7C3AED signals selection and optional light. All other materials are proposals. Pointer-coarse Small retains 44px touch target.

## Existing implementations inspected (main 02a2ff32)
- `src/tools/legacy/shared/react-ui/components.jsx`: production tools Button and IconButton, native buttons and forwarded refs. Styles from tools/base.css, shared/react-ui/components.css, current-design.css.
- `src/tools/legacy/shared/design-system/buttons.css`: additional action-button layer, including circular upload/download/delete controls.
- `src/components/ui/Button.tsx`: separate catalog/shell CVA Button, Radix Slot asChild, primary/secondary/ghost.
- `src/pages/DesignSystem.tsx`, ButtonGallery: catalog's own `.axolotl-star-border` demo. It is NOT imported as the official React Bits source.
These are references only; the three new families are experimental implementations, not imported production Buttons. Existing lucide-react supplies icons and Radix Dialog supplies focus-trapped confirmation and mobile controls. React and CSS only; no new dependencies, backend or persistence.

## Official React Bits source
`vendor/StarBorder.jsx`, `vendor/StarBorder.css`, `vendor/LICENSE.md` copied byte-for-byte from DavidHDev/react-bits at `c2a1408d9219a5bd7a2d9c93c9c499042f5fa34a` (2026-10-19).
https://github.com/DavidHDev/react-bits/tree/c2a1408d9219a5bd7a2d9c93c9c499042f5fa34a/src/content/Animations/StarBorder

Current upstream uses a canvas following the measured rounded outline. Its real public speed API is numeric **duration**, seconds per orbit (not the older speed string API). Integration keeps the complete original animation engine. Uses color, duration, radius, theme, stars=2, hover=brighten, clickPulse=false, sparkle=false and className. No imitation or rewritten animation. Original default geometry/one star/hover behavior remains alongside it under Původ & reference. Full MIT + Commons Clause notice is included in source, standalone HTML and LICENSE-react-bits.txt. This lab is an application, not a redistributed component library.

Disabled/loading use native disabled and unmount the optional animation. Reduced-motion switches the integrated Button to a static outline and hides the reference canvas; source files remain unchanged. No decorative background animation.

## Build and verification
`node experiments/button-studio-01/build.mjs`
`node experiments/button-studio-01/check-browser.mjs`

Browser checks: all 15 combinations, keyboard Enter/Space, measured sizes, pointer active transforms, native disabled/loading, real changing Star Border canvas frames, public controls, unmodified reference, async CTA, form submission, Radix dialog, focus mode, dark/light, 1366×768/1920×1080/390×844, mobile controls focus, reduced motion and axe WCAG A/AA. Reports/screenshots are generated under evidence/. Chromium emulation is not a physical Safari/iPhone test.

## Publication boundary
Publish only as a new `button-studio-01/` directory on `irisKaX/axolotl-preview`. Restore the latest successful complete Pages artifact, guard against a newer deployment, hash every existing file, add the new directory, then verify all previous hashes. No production deployment, merge or environment protection changes.
