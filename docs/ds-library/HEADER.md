# Header · Library V1.1

Canonical behavior and control states: `src/app/header`. The Library maps its
materials once in `theme/header.css`; `dashboard/header.css` owns only approved
Dashboard geometry. The previous `headerTheme.ts` patch layer was removed.
URL focus is a single constant-width border (`--ring`); the WWW icon shares it.
Copy and browser-tab selection are separate actions. Header controls reuse
`--button-radius`; no Dashboard, Office or widget layout changed.

The SEO dot automatically reads `TARGET_INDEXATION` through the existing
transport and selected-tab context. It evaluates Googlebot web: generic and
Googlebot restrictions combine; other robot scopes do not apply. `none` means
both `noindex` and `nofollow`. Any unavailable source remains unknown. Known
blocking directives are red even if the other source is missing. Green requires
both meta and response headers to have been inspected; it never asserts Google
index membership. Edits, tab changes, document tokens and aborts invalidate
previous results, including late replies.

Current extension reads the loaded top document's meta only. It does not capture
`X-Robots-Tag`; favorable meta therefore stays neutral. Manually entered external
URLs are not fetched. No new backend, crawler or permission was added. The
experimental extension permits the canonical preview path as well as its existing
application path; an already installed production build must be replaced with
this branch's unpacked extension to connect to the preview. This does not publish
an extension update or change production main.

Verification: Library build, existing Header/store unit tests, robots evaluation
and stale-response tests, existing extension document-identity tests, and
`scripts/ds-library/check-header.mjs` for dark/light, copy, menus, focus, responsive
layout and 1366 × 768 Dashboard fit. Browser SEO fixtures are synthetic and are
not evidence of a live extension session. `unavailable_after` is conservatively
reported as an unsupported/partial assessment.
