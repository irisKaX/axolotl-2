# Library V1.1 — reference candidate

**Status: candidate. Explicit final approval is still required.** The directory name does not imply approval.

Manifest SHA-256: `d0f695525f0c0d2c4df542638bf3c55394b66bda4ba5c809c6b9ce660f9c0d26`.

Original identity: source `63bda318f5556b12b629016e821e08feb7374281`, preview `0c2bfdcd4ed1a206c23d0988f0c0661c58397f3a`, Header patch `9293f18080e928225f5da9931153e5df1e5b3f1c3e21f10813505d02c669a6d2`. The original independent build was rechecked against all 63 public artifact hashes before correction. This is not a reference generated from the implementation branch.

The user-authorized stabilization regenerates exactly two PNGs: **forms-select-open-dark-1366x768** and **forms-select-open-light-1366x768**. Both visibly show the open listbox with focus on its selected option. The other 94 PNGs, including the previously repaired SEO tooltip, and all 96 computed/geometry JSONs are byte-identical to preceding candidate `f311428b31cfd140f6d5c3c417d857e4e154531b37f0aef45af9d5391fec1096`. Previous checksums and correction history remain in the manifest/Git history.

The original pinned Node, Playwright, Chromium binary, fonts and launch configuration are unchanged. The one-worker raster trial was rejected after a full-run mismatch; it is not part of this candidate. Select state/focus are explicitly checked through capture. Exact PNG and computed comparisons remain mandatory; missing/corrupt reference files fail, and candidate status continues to block release.

**Remaining blocker:** intermittent rounded-edge Header raster differences despite equal CSS/geometry. No exception or pixel tolerance has been introduced. This candidate requires completion of raster stabilization and explicit user approval before it can authorize publication.

Final stabilization verification: 121/121 unit tests, 15/15 baseline contracts and
8/8 required negatives (+2 existing guards) passed. Three final runs completed all
96 cases: exact PNG matches **95/96, 95/96, 96/96**; computed CSS/geometry matches
**96/96 in each**. Both corrected Select references match in all three runs.
Remaining failures are light Media (60 pixels) and light Settings (31 pixels),
rounded focus-outline edges only, maximum channel delta4/255. They remain strict
failures. **BLOCKED**, candidate only. One initial unit run under simultaneous
browser load timed out waiting for the QR tool heading; the full isolated suite
passed unchanged, with no increased timeout or retry setting.

## Cases

| Case | Screenshot | Geometry / computed CSS |
|---|---|---|
| dashboard-default-dark-320x800 | [PNG](dashboard-default-dark-320x800.png) | [JSON](dashboard-default-dark-320x800.json) |
| dashboard-default-light-320x800 | [PNG](dashboard-default-light-320x800.png) | [JSON](dashboard-default-light-320x800.json) |
| dashboard-default-dark-390x844 | [PNG](dashboard-default-dark-390x844.png) | [JSON](dashboard-default-dark-390x844.json) |
| dashboard-default-light-390x844 | [PNG](dashboard-default-light-390x844.png) | [JSON](dashboard-default-light-390x844.json) |
| dashboard-default-dark-768x1024 | [PNG](dashboard-default-dark-768x1024.png) | [JSON](dashboard-default-dark-768x1024.json) |
| dashboard-default-light-768x1024 | [PNG](dashboard-default-light-768x1024.png) | [JSON](dashboard-default-light-768x1024.json) |
| dashboard-default-dark-1180x820 | [PNG](dashboard-default-dark-1180x820.png) | [JSON](dashboard-default-dark-1180x820.json) |
| dashboard-default-light-1180x820 | [PNG](dashboard-default-light-1180x820.png) | [JSON](dashboard-default-light-1180x820.json) |
| dashboard-default-dark-1366x768 | [PNG](dashboard-default-dark-1366x768.png) | [JSON](dashboard-default-dark-1366x768.json) |
| dashboard-default-light-1366x768 | [PNG](dashboard-default-light-1366x768.png) | [JSON](dashboard-default-light-1366x768.json) |
| dashboard-default-dark-1440x900 | [PNG](dashboard-default-dark-1440x900.png) | [JSON](dashboard-default-dark-1440x900.json) |
| dashboard-default-light-1440x900 | [PNG](dashboard-default-light-1440x900.png) | [JSON](dashboard-default-light-1440x900.json) |
| dashboard-url-hover-dark-1366x768 | [PNG](dashboard-url-hover-dark-1366x768.png) | [JSON](dashboard-url-hover-dark-1366x768.json) |
| dashboard-url-hover-light-1366x768 | [PNG](dashboard-url-hover-light-1366x768.png) | [JSON](dashboard-url-hover-light-1366x768.json) |
| dashboard-url-focus-dark-1366x768 | [PNG](dashboard-url-focus-dark-1366x768.png) | [JSON](dashboard-url-focus-dark-1366x768.json) |
| dashboard-url-focus-light-1366x768 | [PNG](dashboard-url-focus-light-1366x768.png) | [JSON](dashboard-url-focus-light-1366x768.json) |
| dashboard-copy-pressed-dark-1366x768 | [PNG](dashboard-copy-pressed-dark-1366x768.png) | [JSON](dashboard-copy-pressed-dark-1366x768.json) |
| dashboard-copy-pressed-light-1366x768 | [PNG](dashboard-copy-pressed-light-1366x768.png) | [JSON](dashboard-copy-pressed-light-1366x768.json) |
| dashboard-media-open-dark-1366x768 | [PNG](dashboard-media-open-dark-1366x768.png) | [JSON](dashboard-media-open-dark-1366x768.json) |
| dashboard-media-open-light-1366x768 | [PNG](dashboard-media-open-light-1366x768.png) | [JSON](dashboard-media-open-light-1366x768.json) |
| dashboard-settings-open-dark-1366x768 | [PNG](dashboard-settings-open-dark-1366x768.png) | [JSON](dashboard-settings-open-dark-1366x768.json) |
| dashboard-settings-open-light-1366x768 | [PNG](dashboard-settings-open-light-1366x768.png) | [JSON](dashboard-settings-open-light-1366x768.json) |
| dashboard-seo-tooltip-dark-1366x768 | [PNG](dashboard-seo-tooltip-dark-1366x768.png) | [JSON](dashboard-seo-tooltip-dark-1366x768.json) |
| dashboard-seo-tooltip-light-1366x768 | [PNG](dashboard-seo-tooltip-light-1366x768.png) | [JSON](dashboard-seo-tooltip-light-1366x768.json) |
| dashboard-seo-allowed-dark-1366x768 | [PNG](dashboard-seo-allowed-dark-1366x768.png) | [JSON](dashboard-seo-allowed-dark-1366x768.json) |
| dashboard-seo-allowed-light-1366x768 | [PNG](dashboard-seo-allowed-light-1366x768.png) | [JSON](dashboard-seo-allowed-light-1366x768.json) |
| dashboard-seo-blocked-dark-1366x768 | [PNG](dashboard-seo-blocked-dark-1366x768.png) | [JSON](dashboard-seo-blocked-dark-1366x768.json) |
| dashboard-seo-blocked-light-1366x768 | [PNG](dashboard-seo-blocked-light-1366x768.png) | [JSON](dashboard-seo-blocked-light-1366x768.json) |
| dashboard-compact-open-dark-390x844 | [PNG](dashboard-compact-open-dark-390x844.png) | [JSON](dashboard-compact-open-dark-390x844.json) |
| dashboard-compact-open-light-390x844 | [PNG](dashboard-compact-open-light-390x844.png) | [JSON](dashboard-compact-open-light-390x844.json) |
| buttons-default-dark-1440x900 | [PNG](buttons-default-dark-1440x900.png) | [JSON](buttons-default-dark-1440x900.json) |
| buttons-default-light-1440x900 | [PNG](buttons-default-light-1440x900.png) | [JSON](buttons-default-light-1440x900.json) |
| buttons-default-dark-390x844 | [PNG](buttons-default-dark-390x844.png) | [JSON](buttons-default-dark-390x844.json) |
| buttons-default-light-390x844 | [PNG](buttons-default-light-390x844.png) | [JSON](buttons-default-light-390x844.json) |
| forms-default-dark-1440x900 | [PNG](forms-default-dark-1440x900.png) | [JSON](forms-default-dark-1440x900.json) |
| forms-default-light-1440x900 | [PNG](forms-default-light-1440x900.png) | [JSON](forms-default-light-1440x900.json) |
| forms-default-dark-390x844 | [PNG](forms-default-dark-390x844.png) | [JSON](forms-default-dark-390x844.json) |
| forms-default-light-390x844 | [PNG](forms-default-light-390x844.png) | [JSON](forms-default-light-390x844.json) |
| surfaces-default-dark-1440x900 | [PNG](surfaces-default-dark-1440x900.png) | [JSON](surfaces-default-dark-1440x900.json) |
| surfaces-default-light-1440x900 | [PNG](surfaces-default-light-1440x900.png) | [JSON](surfaces-default-light-1440x900.json) |
| surfaces-default-dark-390x844 | [PNG](surfaces-default-dark-390x844.png) | [JSON](surfaces-default-dark-390x844.json) |
| surfaces-default-light-390x844 | [PNG](surfaces-default-light-390x844.png) | [JSON](surfaces-default-light-390x844.json) |
| overlays-default-dark-1440x900 | [PNG](overlays-default-dark-1440x900.png) | [JSON](overlays-default-dark-1440x900.json) |
| overlays-default-light-1440x900 | [PNG](overlays-default-light-1440x900.png) | [JSON](overlays-default-light-1440x900.json) |
| overlays-default-dark-390x844 | [PNG](overlays-default-dark-390x844.png) | [JSON](overlays-default-dark-390x844.json) |
| overlays-default-light-390x844 | [PNG](overlays-default-light-390x844.png) | [JSON](overlays-default-light-390x844.json) |
| navigation-default-dark-1440x900 | [PNG](navigation-default-dark-1440x900.png) | [JSON](navigation-default-dark-1440x900.json) |
| navigation-default-light-1440x900 | [PNG](navigation-default-light-1440x900.png) | [JSON](navigation-default-light-1440x900.json) |
| navigation-default-dark-390x844 | [PNG](navigation-default-dark-390x844.png) | [JSON](navigation-default-dark-390x844.json) |
| navigation-default-light-390x844 | [PNG](navigation-default-light-390x844.png) | [JSON](navigation-default-light-390x844.json) |
| brand-default-dark-1440x900 | [PNG](brand-default-dark-1440x900.png) | [JSON](brand-default-dark-1440x900.json) |
| brand-default-light-1440x900 | [PNG](brand-default-light-1440x900.png) | [JSON](brand-default-light-1440x900.json) |
| brand-default-dark-390x844 | [PNG](brand-default-dark-390x844.png) | [JSON](brand-default-dark-390x844.json) |
| brand-default-light-390x844 | [PNG](brand-default-light-390x844.png) | [JSON](brand-default-light-390x844.json) |
| colors-default-dark-1440x900 | [PNG](colors-default-dark-1440x900.png) | [JSON](colors-default-dark-1440x900.json) |
| colors-default-light-1440x900 | [PNG](colors-default-light-1440x900.png) | [JSON](colors-default-light-1440x900.json) |
| colors-default-dark-390x844 | [PNG](colors-default-dark-390x844.png) | [JSON](colors-default-dark-390x844.json) |
| colors-default-light-390x844 | [PNG](colors-default-light-390x844.png) | [JSON](colors-default-light-390x844.json) |
| feedback-default-dark-1440x900 | [PNG](feedback-default-dark-1440x900.png) | [JSON](feedback-default-dark-1440x900.json) |
| feedback-default-light-1440x900 | [PNG](feedback-default-light-1440x900.png) | [JSON](feedback-default-light-1440x900.json) |
| feedback-default-dark-390x844 | [PNG](feedback-default-dark-390x844.png) | [JSON](feedback-default-dark-390x844.json) |
| feedback-default-light-390x844 | [PNG](feedback-default-light-390x844.png) | [JSON](feedback-default-light-390x844.json) |
| widgets-default-dark-1440x900 | [PNG](widgets-default-dark-1440x900.png) | [JSON](widgets-default-dark-1440x900.json) |
| widgets-default-light-1440x900 | [PNG](widgets-default-light-1440x900.png) | [JSON](widgets-default-light-1440x900.json) |
| widgets-default-dark-390x844 | [PNG](widgets-default-dark-390x844.png) | [JSON](widgets-default-dark-390x844.json) |
| widgets-default-light-390x844 | [PNG](widgets-default-light-390x844.png) | [JSON](widgets-default-light-390x844.json) |
| foundations-default-dark-1440x900 | [PNG](foundations-default-dark-1440x900.png) | [JSON](foundations-default-dark-1440x900.json) |
| foundations-default-light-1440x900 | [PNG](foundations-default-light-1440x900.png) | [JSON](foundations-default-light-1440x900.json) |
| foundations-default-dark-390x844 | [PNG](foundations-default-dark-390x844.png) | [JSON](foundations-default-dark-390x844.json) |
| foundations-default-light-390x844 | [PNG](foundations-default-light-390x844.png) | [JSON](foundations-default-light-390x844.json) |
| buttons-ghost-hover-dark-1366x768 | [PNG](buttons-ghost-hover-dark-1366x768.png) | [JSON](buttons-ghost-hover-dark-1366x768.json) |
| buttons-ghost-hover-light-1366x768 | [PNG](buttons-ghost-hover-light-1366x768.png) | [JSON](buttons-ghost-hover-light-1366x768.json) |
| buttons-destructive-hover-dark-1366x768 | [PNG](buttons-destructive-hover-dark-1366x768.png) | [JSON](buttons-destructive-hover-dark-1366x768.json) |
| buttons-destructive-hover-light-1366x768 | [PNG](buttons-destructive-hover-light-1366x768.png) | [JSON](buttons-destructive-hover-light-1366x768.json) |
| buttons-primary-pressed-dark-1366x768 | [PNG](buttons-primary-pressed-dark-1366x768.png) | [JSON](buttons-primary-pressed-dark-1366x768.json) |
| buttons-primary-pressed-light-1366x768 | [PNG](buttons-primary-pressed-light-1366x768.png) | [JSON](buttons-primary-pressed-light-1366x768.json) |
| buttons-keyboard-focus-dark-1366x768 | [PNG](buttons-keyboard-focus-dark-1366x768.png) | [JSON](buttons-keyboard-focus-dark-1366x768.json) |
| buttons-keyboard-focus-light-1366x768 | [PNG](buttons-keyboard-focus-light-1366x768.png) | [JSON](buttons-keyboard-focus-light-1366x768.json) |
| buttons-loading-dark-1366x768 | [PNG](buttons-loading-dark-1366x768.png) | [JSON](buttons-loading-dark-1366x768.json) |
| buttons-loading-light-1366x768 | [PNG](buttons-loading-light-1366x768.png) | [JSON](buttons-loading-light-1366x768.json) |
| buttons-disabled-dark-1366x768 | [PNG](buttons-disabled-dark-1366x768.png) | [JSON](buttons-disabled-dark-1366x768.json) |
| buttons-disabled-light-1366x768 | [PNG](buttons-disabled-light-1366x768.png) | [JSON](buttons-disabled-light-1366x768.json) |
| buttons-split-open-dark-1366x768 | [PNG](buttons-split-open-dark-1366x768.png) | [JSON](buttons-split-open-dark-1366x768.json) |
| buttons-split-open-light-1366x768 | [PNG](buttons-split-open-light-1366x768.png) | [JSON](buttons-split-open-light-1366x768.json) |
| forms-select-open-dark-1366x768 | [PNG](forms-select-open-dark-1366x768.png) | [JSON](forms-select-open-dark-1366x768.json) |
| forms-select-open-light-1366x768 | [PNG](forms-select-open-light-1366x768.png) | [JSON](forms-select-open-light-1366x768.json) |
| forms-invalid-dark-1366x768 | [PNG](forms-invalid-dark-1366x768.png) | [JSON](forms-invalid-dark-1366x768.json) |
| forms-invalid-light-1366x768 | [PNG](forms-invalid-light-1366x768.png) | [JSON](forms-invalid-light-1366x768.json) |
| overlays-dialog-open-dark-1366x768 | [PNG](overlays-dialog-open-dark-1366x768.png) | [JSON](overlays-dialog-open-dark-1366x768.json) |
| overlays-dialog-open-light-1366x768 | [PNG](overlays-dialog-open-light-1366x768.png) | [JSON](overlays-dialog-open-light-1366x768.json) |
| navigation-selected-dark-1366x768 | [PNG](navigation-selected-dark-1366x768.png) | [JSON](navigation-selected-dark-1366x768.json) |
| navigation-selected-light-1366x768 | [PNG](navigation-selected-light-1366x768.png) | [JSON](navigation-selected-light-1366x768.json) |
| lens-default-dark-1440x900 | [PNG](lens-default-dark-1440x900.png) | [JSON](lens-default-dark-1440x900.json) |
| lens-default-light-1440x900 | [PNG](lens-default-light-1440x900.png) | [JSON](lens-default-light-1440x900.json) |
| lens-default-dark-390x844 | [PNG](lens-default-dark-390x844.png) | [JSON](lens-default-dark-390x844.json) |
| lens-default-light-390x844 | [PNG](lens-default-light-390x844.png) | [JSON](lens-default-light-390x844.json) |
