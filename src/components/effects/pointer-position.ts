/** Convert viewport coordinates to layout coordinates, including preview scaling. */
export function localPointerPosition(
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  width: number,
  height: number,
  clientX: number,
  clientY: number,
) {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (rect.width <= 0 || rect.height <= 0 || x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
  return { x: x * width / rect.width, y: y * height / rect.height };
}
