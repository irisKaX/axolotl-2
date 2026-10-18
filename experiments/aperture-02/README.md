# Aperture 02 · Creative Refinement

Standalone experiment alongside the immutable Aperture 01 exploration. Product IA remains Základy / Komponenty / Vzory / Experimenty. Main, production source and Design System are not edited.

The component is the primary work surface: compact studio rail, lower-density library, quiet inspector, one continuous preview stage, scenario strip directly under the canvas, optional documentation. Focus mode hides both panels and documentation, retains scenario/viewport/theme controls and restores previous panel visibility. Escape inside the iframe closes the actual popup before leaving focus mode.

Select and Field import production fields.jsx and its original CSS. Only the specimen wrapper is composed. AppHeader imports the same frozen production reference as Aperture 01. Preferences and page context are memory-only adapters. No credentials, profiles, persistence or extension API bridge.

Build: `node experiments/aperture-02/build.mjs`.
QA: build the original `experiments/living-catalog/build.mjs`, then run `node experiments/aperture-02/check-browser.mjs` with Chromium installed. Evidence records geometry and interactions at 1366×768, 1920×1080 and 390×844. This is browser emulation, not Safari or physical-device certification.

Hosting: the existing isolated preview branch may add a new `aperture-02-20261018` directory. Preserve all previous preview files byte-for-byte. Do not merge or deploy the production application.
