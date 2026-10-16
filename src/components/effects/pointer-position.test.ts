import { describe, expect, it } from "vitest";
import { localPointerPosition } from "./pointer-position";

describe("cursor coordinates inside a scaled surface", () => {
  const rect = { left: 100, top: 40, width: 500, height: 300 };

  it("preserves screen coordinates on an unscaled surface", () => {
    expect(localPointerPosition(rect, 500, 300, 350, 190)).toEqual({ x: 250, y: 150 });
  });

  it("maps the displayed pointer to the canvas layout dimensions", () => {
    expect(localPointerPosition(rect, 1000, 600, 350, 190)).toEqual({ x: 500, y: 300 });
    expect(localPointerPosition(rect, 1000, 600, 600, 340)).toEqual({ x: 1000, y: 600 });
  });

  it("ignores pointers outside the surface and collapsed surfaces", () => {
    expect(localPointerPosition(rect, 1000, 600, 99, 190)).toBeNull();
    expect(localPointerPosition(rect, 1000, 600, 350, 341)).toBeNull();
    expect(localPointerPosition({ ...rect, width: 0 }, 1000, 600, 100, 40)).toBeNull();
  });
});
