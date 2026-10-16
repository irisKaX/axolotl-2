# Office artwork

Local production artwork based on the approved Creative Studio scene and supplied premium mascot. No runtime image service is used.

- `office-room-v2.webp`: corrected day/night scene,1914×822. The rear-left monitor now has its silver back toward the viewer. Brumlovka remains on the left; no Gamma/O2 building outside. Lossless WebP preserves the new render without the previous lossy encoding. The image service did not honor a requested native4K output; this is not an upscaled4K asset.
- `office-seated-v2.webp`: transparent2×4 atlas,887×1774. Column0 faces right and column1 faces left. Rows: working, low mug, sipping, phone. Bodies always use row0; only isolated hands/arms use the action artwork.
- `office-bodies.webp`: transparent body-only registration of the seated mascot; reconstructed hoodie fabric remains behind the independent arms, avoiding holes or flat patches.
- `office-laptop.webp`: supplied premium laptop sitter; a separate hand layer provides keyboard taps and a brief phone check.
- `office-mug.webp`: transparent 256×256 ceramic O₂ mug, generated as a separate prop with matching soft material shading. It stays visible throughout the sip rather than swapping between baked poses.

Built-in imagegen was used for the two v2 replacements. Room prompt: preserve the original aligned day/night layout, reverse only the rear-left monitor toward its chair, render crisp deep-focus materials with no characters/desk mugs. Seated prompt: preserve the mascot identity, provide left/right three-quarter seated views, stable body registration, work/low-mug/sip/phone poses, transparent background. Source PNGs are retained in the generation history. Encoding is lossless; no offline creative raster edits were made.

CSS defines furniture occlusion and arm clipping. `office-activity.ts` schedules only stationary activities. Walking artwork is intentionally removed.

Body-layer edit prompt: keep the atlas registration, heads, feet and hoodie torso; remove both arms, hands, mugs and phones and reconstruct the hidden fabric. Cup movement uses one independent ceramic prop from rest to mouth and back.
