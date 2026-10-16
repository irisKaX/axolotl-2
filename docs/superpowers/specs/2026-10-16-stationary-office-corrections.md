# Stationary office corrections

The user rejected walking and the shifting full-body typing animation. All four axolotls remain seated. Three desk workers face their monitors; the laptop worker also types and occasionally checks a phone. Breaks consist of short coffee or phone actions at the workstation.

Keep each worker's head, torso and feet registered to one resting frame while typing. Animate hands independently with sub-pixel keyboard taps. During breaks, layer only the arm and prop; do not switch whole-body sprite frames. Respect pause, visibility and reduced motion through the existing active-time clock. Theme changes must not reset the activity timeline.

The front and back workers need actual left-facing three-quarter artwork. The rear-left monitor's silver back faces the viewer and its screen faces its worker. Use a fresh lossless room render with exact atlas geometry, removing unnecessary whole-sprite filters and atlas stretching. Do not claim native 4K: the image service returned 1914-pixel-wide scenery despite a higher-resolution request.

The user separately requested an exploratory redesign based on the original curved-window lounge: warm LED step edges, globe pendant lights, plants and open desks instead of individual cubicle walls. This is a visual proposal; it does not replace the live composition in this correction without a selected design.

Verify: stationary seat positions throughout the cycle; fixed body artwork and bounds while typing; visible independent hand motion including laptop; working pause and reduced motion; correct monitor alignment; no walking assets requested; clean desktop/mobile screenshots. Publish the tested correction using the existing main deployment authorization.
