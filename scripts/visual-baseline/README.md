# S01/S02 visual reference gate

This is test infrastructure for the existing V1.1 Library, not another catalog.
The reference is the independent S01 commit, never the build under test. Its manifest
SHA-256 must come from a separate reviewed pin. Missing files, mismatched hashes,
coverage or toolchain differences fail closed. Pixel comparison is exact.

## Trust and capture

`tests/visual/approved-v1-1/manifest.json` is **candidate**, not approved. The directory
name follows the blueprint. Diagnostic comparison never authorizes a release.
The strict runner and preview wrapper never update reference files. The manual S01
capture utility is not called by CI. Do not modify references during a test run.

The preceding FINAL FIX repaired the dark SEO tooltip. This stabilization repairs
only `forms-select-open-dark-1366x768.png` and `forms-select-open-light-1366x768.png`,
explicitly authorized by the user, from the same independent original build.
The other 94 PNGs (including SEO) and all 96 computed JSONs are unchanged from the
preceding candidate. The manifest retains previous checksums and original identity.

Capture waits two paint frames, then suspends JavaScript callbacks only while
reading computed values and taking one screenshot. This prevents screenshot-induced
resize callbacks from moving focus or closing Select. Callbacks resume in `finally`.
Select cases require an expanded trigger, visible listbox and focus inside it;
visibility/expanded state and focus are also guarded through capture. A closed
Select fails, rather than producing a new reference. Actual motion and interaction
tests still run normally, without capture-time suspension.

The remaining intermittent Header differences are rounded-edge raster output:
all Header CSS properties, unrounded rects, font states, animation timing, viewport
and scroll remained identical in the controlled probe, including failing PNGs.
The existing renderer is already software-only. A trial with one raster worker
matched 16/16 targeted frames but failed two cases in a full run; it was reverted.
The pinned Node, Playwright, Chromium, fonts and Chromium launch settings therefore
remain unchanged. No pixel tolerance, masking or automatic approval is allowed.

The remaining renderer issue is still **BLOCKED**, not waived as harmless noise.
Proposed next narrow investigation: force complete compositor/raster work before
capture in this same Chromium (`--run-all-compositor-stages-before-draw`), validate
the two affected states first, and retain it only if all 96 references match exactly.
This is an unverified proposal, not an implemented fix or permission to update the
other 94 PNGs. Evidence retains the exact diff images and the rejected worker trial.

The stale Surfaces assertion now uses **Theme Card**, as introduced by registry
commit `c586ee04a2dc15ed9bd01076a7ed7602a42dc461` and the superseding
`docs/ds-library/CONSOLIDATION.md` / `TWEAKCN.md`. No component was changed.

Local and CI use the same digest-pinned Node 24.19.0 / Debian 13 image, locked
Playwright 1.64.1 and original Chromium 154.0.8037.57 binary. The original Chromium
package is no longer in apt; `runtime/` holds its checksum-locked test-only archive
in two Git-compatible chunks (112 MiB total), with upstream copyright notices.
Fontconfig excludes incidental host-only OpenAI Sans fonts, unused by Axolotl;
the 527 remaining font files match the container exactly. Proprietary fonts are
not redistributed. The manifest retains the original capture toolchain separately
and explicitly records this comparison-environment normalization. All checks still
require exact executable, OS, font and Fontconfig hashes.

Final stabilization verification: 121/121 unit tests, 15/15 baseline contracts and
8/8 required negatives (+2 existing guards) passed. Three final runs completed all
96 cases: exact PNG matches **95/96, 95/96, 96/96**; computed CSS/geometry matches
**96/96 in each**. Both corrected Select references match in all three runs.
Remaining failures are light Media (60 pixels) and light Settings (31 pixels),
rounded focus-outline edges only, maximum channel delta4/255. They remain strict
failures. **BLOCKED**, candidate only. One initial unit run under simultaneous
browser load timed out waiting for the QR tool heading; the full isolated suite
passed unchanged, with no increased timeout or retry setting.

## Commands

Build the same test container used by the existing preview workflow:

```sh
docker build -f scripts/visual-baseline/Dockerfile -t axolotl-milestone-a:test scripts/visual-baseline
```

Run `ci.sh` inside it with separate source, preview, harness and reference checkouts
and a fresh `RUNNER_TEMP`. Follow the explicit bind mounts in
`axolotl-preview/.github/workflows/preview.yml`, including a **read-only reference**.
The script builds and tests only; a candidate or mismatch exits nonzero.

Use separate checkouts for source, S01 reference and S02 test harness. Install the
source's locked dependencies (`npm ci`), and make those dependencies available to
the harness. Build the private, existing Lens fixture outside `source/dist`:

```sh
node --input-type=module -e "import {build} from 'vite'; await build({base:'/verification/lens/',build:{outDir:process.env.LENS_DIST,rollupOptions:{input:'scripts/button-lens-02/fixture.html'}}});"
```

Serve the unchanged Library build at `LIBRARY_URL`. Serve the fixture directory
separately and set `LENS_URL` to its `scripts/button-lens-02/fixture.html` URL.
Without `LENS_URL` it uses `/verification/lens/scripts/button-lens-02/fixture.html`
on the Library origin, as in the local reference archive. No fixture is published.

```sh
node --test scripts/visual-baseline/contract.test.mjs
node scripts/visual-baseline/motion.mjs "$LIBRARY_URL"
node scripts/visual-baseline/button-states.mjs "$LIBRARY_URL"
node scripts/visual-baseline/negative.mjs --baseline "$BASELINE_DIR" --sha256 "$BASELINE_SHA256" --url "$LIBRARY_URL" --report "$NEGATIVE_REPORT"
node scripts/visual-baseline/check.mjs --baseline "$BASELINE_DIR" --sha256 "$BASELINE_SHA256" --url "$LIBRARY_URL" --output "$NEW_OUTPUT_DIRECTORY"
```

Every comparison output must be a **new directory outside the reference**.
`--diagnostic` on `check.mjs` permits comparison against a candidate and labels
success as non-authorizing; it does not relax hashes, pixels, toolchain or coverage.
The preview publication wrapper intentionally offers no diagnostic mode:

```sh
BASELINE_DIR=/absolute/pinned-reference/tests/visual/approved-v1-1 \
BASELINE_SHA256=d0f695525f0c0d2c4df542638bf3c55394b66bda4ba5c809c6b9ce660f9c0d26 \
VISUAL_HARNESS_DIR=/absolute/pinned-harness/scripts/visual-baseline \
BASELINE_OUTPUT=/absolute/new-results \
LIBRARY_URL="$LIBRARY_URL" \
node /absolute/preview/scripts/check-header-polish.mjs /absolute/source
```

No `/tmp/header-polish-baseline.json`, optional baseline or `--record` path exists.
The wrapper preserves its functional Header checks and then invokes the mandatory
strict runner. Candidate status, unit failures or environment mismatch block the
existing build job, so the unchanged dependent deploy job cannot run.

## Coverage / evidence

The reference index lists all 96 screenshots and JSON snapshots. Mandatory viewport
coverage is on Dashboard/Header; family samples cover desktop/mobile, and explicit
state cases avoid an unnecessary Cartesian screenshot matrix. Button contracts
exercise 7 types × S/M/L × original/unified × dark/light (84 combinations), including
native activation, hover, pressed, keyboard focus, loading, disabled, and Split menu
focus. Existing Library checks cover Star Border, contrasts, portals, forms and
accessibility. Motion tests verify actual orbit progress and reduced-motion stop.

`negative.mjs` first proves the unmodified browser cases match the pinned reference,
then mutates only disposable page DOM for Header geometry, purple, logo size and
Button count. Other negatives use temporary copies or deliberately wrong parameters.
The contract tests also exercise reference corruption, traversal, approval and exact
pixel failure. No test mutation touches runtime sources or the reference checkout.

The local archive also contains the complete site, original Git bundles, private
Lens build, font/build manifests and reconstruction instructions. Proposed durable
storage is a release asset in the existing preview repository, only after separate
approval. This milestone does not push, open a PR, publish a release, deploy, or
continue to S03.

## Final validation: CSS Module comparison identity

The comparison now normalizes only Vite's generated `_local_hash_line` class
identity, retaining `local`, ordinary classes, node order and every captured
computed/geometry/SVG value. Raw snapshots and their pinned checksums stay intact.
The runner separately records raw equality and class-identity-only changes.
PNG comparison remains exact; a pixel mismatch with equal visual data is still
FAIL pending diagnosis, never automatic raster-noise approval. Candidate status
continues to block release even when all visual comparisons pass.
