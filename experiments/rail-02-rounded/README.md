# Rail 02 · Rounded Refinement
Isolated targeted iteration, not a production Design System change.

Original Rail and ALL Ghost instances import Button directly from the unchanged Button Studio 01. The stylesheet imports its original CSS. No previous source files are modified.

Only non-Ghost rounded variants change: outer radius to a capsule (half actual height), right icon compartment outside corners to match, and the unmodified official Star Border's public radius API from 2 to 100 (clamped by its existing outline engine). Material, dimensions, typography, divider, shadow, hover and pressed remain inherited. On narrow phones comparisons stack instead of compressing button geometry.

The Star Border source and MIT + Commons Clause notice remain in Button Studio's vendor directory; build includes the full notice and writes LICENSE-react-bits.txt. No new dependencies, backend or storage.

Build: `node experiments/rail-02-rounded/build.mjs`
QA: `node experiments/rail-02-rounded/check-browser.mjs`

QA compares dimensions/material/type at all 15 size/variant pairs in both themes; exact Ghost computed styles (including descendants) in default/hover/pressed/disabled/loading; native focus and keyboard; actual changing Star Border frames and radius; reduced motion; desktop/mobile and axe. Reports are generated in evidence/. Physical Safari/iPhone remains untested.

Publish only new `rail-02-rounded/` directory on axolotl-preview; restore latest complete artifact and verify all prior file SHA-256 hashes. No main, production, Header, previous experiments or environment protections change.
