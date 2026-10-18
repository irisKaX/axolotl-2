# Living Component Catalog — visual exploration, 18 October 2026

Status: three experimental directions for review. No production integration or approval implied.

Source baseline: `02a2ff32b8da590d0d7232c063a43d62bc736e7d`.
Brief: approved Living Component Catalog Product/UX Blueprint, supplied in `Vložený markdown(8).md`, plus the current explicit request for three functional visual prototypes.

## Directions

1. **Aperture**: cinematic technical console; graphite, precise dividers, restrained metadata and a framed viewport.
2. **Atelier**: editorial working collection; warm paper, serif titles, chapter navigation, ruled inspector and a print-like sheet. Opens in light mode deliberately; supports dark.
3. **Float**: spatial workbench; independent rounded islands, translucent materials and soft light outside the test viewport.

All directions expose identical tasks and fixtures. The Select itself is not restyled to suit a direction.

## Scope and isolation

- Only files inside `experiments/living-catalog/` are added to the product repository, on `experiment/living-catalog-20261018`.
- No changes to main, production `src`, dependencies, DesignSystem, or production deployment workflow.
- Header is a direct import of the original AppHeader with original CSS. Page and preference adapters are memory-only and have no bridge transport or storage writes.
- The reference header can be interacted with. Its navigation demonstrates active states; tools are outside this prototype and a notice says so.
- Select and Field are direct production imports from `fields.jsx`, with original relevant style files and a separate iframe document. Portals stay inside that document.
- Only whitelisted configuration messages from the parent window are accepted. Parent accepts messages only from its current example iframe.
- Header Select remains a reference entry. Its local Choice was not extracted.
- Existing standalone experiments are linked, not replaced.

## Functional coverage

- Four categories, local search, browser history, direct query links.
- Real Select keyboard/pointer selection, disabled option/control, long text and Field error fixtures; reset and live value feedback.
- Independent preview dark/light, 100/115% inherited text token, reduced motion and true iframe widths (390/768/1280/available). Fixed font sizes in the actual component remain truthful.
- Production theme control changes the shell and header; preview theme is independent.
- Right properties panel hides to enlarge the stage. On tablets it moves below; mobile library expands inline.
- Documentation tabs, real source links, read-only approval state, planned items clearly labeled.
- No backend, sign-in, storage, actual export, or extension connection.

## Reproduce

From repository root with its existing lockfile:

```sh
npm ci
node experiments/living-catalog/build.mjs
```

Output: self-contained HTML in `experiments/living-catalog/dist/`.
The output has no external script/font/CDN dependencies.

Remote browser QA:

```sh
npx playwright install --with-deps chromium
node experiments/living-catalog/check-browser.mjs
```

The check generates screenshots at 1366×768 in both themes, 1920×1080 and 390×844, verifies interaction scenarios and compares computed production-header styles across directions. See the uploaded `living-catalog-evidence` artifact and public evidence folder after a successful run. Chromium emulation is not a physical Mac/iPhone or Safari test.

## Public preview preservation

A separate experimental branch in `axolotl-preview` restores the current successful Pages artifact (run 39078876114), adds only `living-catalog-20261018/`, verifies preexisting files byte-for-byte, then publishes that experimental preview host. It does not publish the production `axolotl-2` host or update either main branch. The existing artifact is pinned, not reconstructed from potentially changed source.

## Boundaries for this exploration

Five-component rollout and a complete catalog registry remain future implementation work. Only Select is live in this visual exploration; other component entries are explicitly planned. Creative direction and production integration need separate user decisions.
