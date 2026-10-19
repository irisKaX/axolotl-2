# Lens 02 · Clean Icon

Isolated experimental comparison. Not a production Design System release.

Both columns import the unchanged Lens Button from Button Studio 01. The Clean Icon column adds one scoped CSS rule removing only the icon wrapper background, border, shadow and corner rounding. No geometry, typography, button material or behavior is changed. This applies to all five variants, including Ghost and Icon. The original icon hit target and optical position are retained.

React Bits Star Border is the exact original vendor implementation from Button Studio 01, including its license and attribution. Animation code, radius, colors and numeric duration API are unchanged. Existing disabled/loading/reduced-motion fallbacks are reused.

Run `node experiments/lens-02-clean-icon/build.mjs`. QA: `node experiments/lens-02-clean-icon/check-browser.mjs` in approved CI Chromium. Only this directory is added; no prior experiments or production files are modified.
