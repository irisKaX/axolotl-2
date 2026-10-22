# S01/S02 visual reference gate

This is test infrastructure for the existing V1.1 Library, not another catalog.
The reference is the independent S01 commit, never the build under test. Its manifest
SHA-256 must come from a separate reviewed pin. Missing files, mismatched hashes,
coverage or toolchain differences fail closed. Pixel comparison is exact.

## Trust and current blockers

`tests/visual/approved-v1-1/manifest.json` is **candidate**, not approved. The directory
name follows the blueprint. Diagnostic comparison never authorizes a release.
The strict runner and preview wrapper never update reference files. The capture
utility is manual S01 tooling, refuses an existing destination, and is not called
by CI. Do not modify screenshots or approval status during a test run.

The FINAL FIX regenerated only `dashboard-seo-tooltip-dark-1366x768.png` from
that original build. The other 95 PNGs and all 96 computed snapshots are unchanged.
Capture waits for two paint frames, then suspends JavaScript callbacks just while
reading computed values and taking one screenshot. This prevents Chromium's
full-page resize from moving focus or closing a popup; callbacks resume in `finally`.
Focus drift still fails. Runtime interaction and motion tests run without suspension.
Each comparison records exact PNG/computed hashes for independent-run comparison.

Two further defective original references remain blocked: `forms-select-open`
(dark/light) PNGs show a closed Select, while their JSON describes the open state.
A raw screenshot reproduces both old PNG hashes and records focus moving from the
selected option to the closed combobox. They must not be silently regenerated:
the FINAL FIX authorizes replacement of the SEO tooltip PNG only.

Final local verification in the shared container: three independent runs produced
identical PNG and computed fingerprints for all 96 states. Geometry/computed
values match all 96 references; exact PNG comparison passes 94/96 in each run,
rejecting only the two preserved Select references. This is **BLOCKED**, not a
successful baseline gate. The rebuilt public artifact matches all 63 original files.

The subsequent full CI-equivalent pipeline also caught intermittent Header raster
mismatches: `dashboard-default-light-320x800` (80 pixels, maximum channel delta 19)
and `dashboard-settings-open-dark-1366x768` (44 pixels, maximum channel delta 3).
Their computed CSS/geometry matches exactly. These failures are **not waived**;
three matching isolated runs do not establish complete pipeline stability. Further
renderer stabilization and the two Select-reference corrections remain blockers.

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
BASELINE_SHA256=f311428b31cfd140f6d5c3c417d857e4e154531b37f0aef45af9d5391fec1096 \
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
