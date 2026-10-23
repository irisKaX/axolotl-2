#!/usr/bin/env bash
# Build/test only, shared by the existing preview workflow and local container run.
set -euo pipefail
: "${SOURCE_DIR:?}" "${PREVIEW_DIR:?}" "${VISUAL_HARNESS_DIR:?}" "${BASELINE_DIR:?}" "${BASELINE_SHA256:?}" "${RUNNER_TEMP:?}"
cd "$SOURCE_DIR"
npm ci
node scripts/ds-library/build.mjs
status=0
npm run typecheck || status=1
npm test || status=1
npm run test:legacy || status=1
npm run test:tools || status=1
node --test "$VISUAL_HARNESS_DIR/contract.test.mjs" tests/header-preview-bridge.test.mjs tests/bridge-original-indexation.test.mjs || status=1
export LIBRARY_URL=http://127.0.0.1:4185/axolotl-preview/ds-library-v1-1/
export LENS_DIST="$RUNNER_TEMP/lens-site/verification/lens"
export LENS_URL=http://127.0.0.1:4197/verification/lens/scripts/button-lens-02/fixture.html
export BASELINE_OUTPUT="$RUNNER_TEMP/baseline-comparison"
node --input-type=module -e "import {build} from 'vite'; await build({base:'/verification/lens/',build:{outDir:process.env.LENS_DIST,rollupOptions:{input:'scripts/button-lens-02/fixture.html'}}});"
npm run preview -- --host 127.0.0.1 --port 4185 --base /axolotl-preview/ds-library-v1-1/ --strictPort >"$RUNNER_TEMP/library-preview.log" 2>&1 &
server_pid=$!
python3 -m http.server 4197 --bind 127.0.0.1 --directory "$RUNNER_TEMP/lens-site" >"$RUNNER_TEMP/lens-preview.log" 2>&1 &
lens_pid=$!
trap 'kill "$server_pid" "$lens_pid"' EXIT
for attempt in $(seq 1 20); do
  curl --fail --silent "$LIBRARY_URL" >/dev/null && curl --fail --silent "$LENS_URL" >/dev/null && break
  sleep 1
done
curl --fail --silent "$LIBRARY_URL" >/dev/null
curl --fail --silent "$LENS_URL" >/dev/null
node scripts/ds-library/check-theme.mjs || status=1
node scripts/ds-library/check-contrast.mjs || status=1
node "$VISUAL_HARNESS_DIR/motion.mjs" "$LIBRARY_URL" || status=1
node "$VISUAL_HARNESS_DIR/button-states.mjs" "$LIBRARY_URL" || status=1
node "$VISUAL_HARNESS_DIR/negative.mjs" --baseline "$BASELINE_DIR" --sha256 "$BASELINE_SHA256" --url "$LIBRARY_URL" --report "$RUNNER_TEMP/baseline-negative.json" || status=1
# Strict gate only: candidate is never release authorization, even with exact pixels.
node scripts/ds-library/check-header.mjs --release || status=1
exit "$status"
