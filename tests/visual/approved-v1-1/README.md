# Library V1.1 — reference candidate

**Status: candidate. No approval or release authorization.** The path follows the approved blueprint; its name does not imply approval.

Manifest SHA-256: `ff42865ee9f21a733aef22fa7b21da15279022bcdd728609d9201eda69c10e8b`.

Reconstructed exclusively from source `63bda318f5556b12b629016e821e08feb7374281`, preview `0c2bfdcd4ed1a206c23d0988f0c0661c58397f3a`, original Header patch `9293f18080e928225f5da9931153e5df1e5b3f1c3e21f10813505d02c669a6d2`. All 63 public site files matched byte for byte. Original Actions archive download was blocked by the network proxy; reconstruction was not taken from the implementation branch.

96 cases: 12 Dashboard viewport/theme combinations, Header interactions and synthetic SEO bridge states, ten Library families, Button/Split/form/dialog/navigation states, existing private Button Lens 02 fixture. Each case has a PNG and computed-style/geometry JSON. The manifest lists environment, fonts, asset hashes and each state.

Exact comparison is required; no tolerance or update-snapshots. A repeat comparison already found renderer differences in the mobile Header despite identical geometry/computed values. A second comparison found a changed focus in the SEO-tooltip screenshot and a 19-pixel light compact-menu raster difference. The tooltip screenshot is unsuitable for approval; the harness now rejects focus changes during screenshot capture. This candidate is preserved as evidence, not replaced to hide differences. See the S01/S02 handover for complete comparison results and blocking conditions.

The original Lens fixture is private test infrastructure, not another catalog or published artifact. Static screenshots freeze infinite animations at t=0, finish finite animations, fix Date, locale and storage, and hide the caret. Separate tests verify real-time motion. Public artifact data is unchanged.

Approval requires an explicit user decision identifying this manifest and reviewed screenshots. A future approved manifest must be separately reviewed and externally pinned; never change status or hash in a normal test run. Publication must remain blocked until approval, exact comparison, compatible toolchain and the complete unit suite all pass.

## Review index

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
