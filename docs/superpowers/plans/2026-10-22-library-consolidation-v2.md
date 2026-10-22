# Library V1.1 consolidation V2

Implement the supplied V2 brief in the existing consolidation branch. No production edits or merge. Publish only axolotl-preview after focused validation.

1. Preserve exact 523c983 reference in a temporary regression fixture. Replace the iframe with a catalog React Dashboard composed of the existing AppHeader, OfficePlaceholder and six WidgetSurface instances. Reuse production Header implementation unchanged; apply catalog-scoped approved styles and the existing local context. Preserve navigation, portals, URL, themes, sticky and keyboard behavior.
2. Move existing palette definitions to canonical design-system tokens with a compatibility re-export for the catalog. Register semantic/material/geometry/motion values once, retaining existing values and approval scope. Add Foundations inventory for existing sources and unresolved decisions; do not invent a new global scale.
3. Register the actual Header/Dashboard/Office/widget exports and their props/states. Preserve Button/Star Border, forms, navigation and Mascot V3. Remove standalone HTML/JS/bundled Header assets and the obsolete build adapter after visual parity passes.
4. Run TypeScript/build and a focused browser check: dark/light geometry and paints against 523c983, menu/URL/settings/focus, responsive layout, hover/beam/reduced motion, absence of iframe. Preserve the reference until this check succeeds.
5. Update preview assembly and deployment in the existing preview branch. Publish the existing Library URL only; retain/redirection-map historical routes and point Modular Playground to the Library Dashboard after parity. Verify the published commit and working page. Network/API or Pages authorization failures are external prerequisites, not evidence of publication.

Review focus: production Header untouched; no duplicate Header implementation; portal styles and sticky geometry; one canonical palette and honest approval states; no stale reference replacing current preview.
