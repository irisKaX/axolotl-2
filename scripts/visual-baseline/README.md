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

The captured candidate has a known SEO-tooltip focus race (the PNG differs from
its preceding computed snapshot) and small intermittent Chromium raster differences.
Keep these evidence files unchanged. Approval is blocked. The harness now also
rejects focus changes during capture. Full unit tests additionally expose the
pre-existing `Surfaces.test.tsx` Halo Soft / Theme Card mismatch, outside S01/S02.

The local baseline uses Node 24.19.0, Playwright 1.64.1, Debian 13 and system Chromium
154.0.8037.57, identified by executable/OS/system-font hashes. The existing CI
Ubuntu image and Playwright Chromium 156 are **not equivalent**; the gate blocks
them. Do not bypass this with a tolerance or a newly captured reference. Establish
and review an identical rendering environment before remote activation.

## Commands

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
BASELINE_SHA256=ff42865ee9f21a733aef22fa7b21da15279022bcdd728609d9201eda69c10e8b \
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
