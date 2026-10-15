# Imported tool regressions

Run all imported tool tests from the project root:

```sh
node scripts/test-tools.mjs
```

The runner includes the companion bridge regressions from `tests/bridge-*`.
It uses Node's test runner and also accepts its options, such as
`--test-name-pattern=QR`. Tests cover the actual migrated tool modules, with
backend imports and PDF page-script execution pointing to `browser-extension/`.
There is no duplicate backend implementation in this test directory.

These are deterministic model, controller, collector, network, codec, and
lifecycle regressions. JSDOM and the support adapters supply DOM/API fixtures;
they do not claim browser rendering, layout, or a live extension session.
The QR tests independently decode rendered pixels with jsQR. WebP tests execute
the packaged WASM codec. ZIP tests inspect generated archive entries with JSZip.
The presentation tests render the actual JSX with React's server renderer.

Migration adaptations preserve original behavior assertions:

- Backend and PDF content-script paths target the distributed companion source.
- JSZip is imported from the installed package instead of an obsolete global.
- Download notification assertions describe handing the file to the browser;
  cancellation, pending-state, locking, and late-result checks remain intact.
- Search access retries use `SITE_ACCESS` through the companion API. Additional
  cases reject non-boolean grants and late replies after a target change or
  destruction, including a different tab at the same URL.
- Overflow clipping fixtures set `overflow-x` and `overflow-y` explicitly.
  JSDOM 30 reports those computed values as `visible` for the `overflow:hidden`
  shorthand, unlike browser computed styles. Clipping expectations are unchanged.
- Original minimal DOM support adapters accompany the lifecycle tests. The
  worker compatibility adapter also resolves the real companion worker source.
