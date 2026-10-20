import { describe, expect, it } from "vitest";
import { initialLayout, reduceLayout, compositions, dimensions, packBottom } from "./model";
describe("layout sandbox", () => {
  it("resizes new bottom widgets across columns independently of height and fills gaps", () => {
    let state = reduceLayout(initialLayout(), { type: "add", kind: "generic" });
    const item = state.items.at(-1)!;
    state = reduceLayout(state, { type: "resize", id: item.id, size: item.size, height: item.height, span: 3 });
    expect(state.items.at(-1)).toMatchObject({ span: 3, height: item.height });
    const wide = state.items.at(-1)!;
    const positions = packBottom([{ ...wide, id: "a", span: 2 }, { ...wide, id: "b", span: 2 }, { ...wide, id: "c", span: 1 }]);
    expect(positions).toEqual([{ column: 1, row: 0, span: 2 }, { column: 1, row: 1, span: 2 }, { column: 3, row: 0, span: 1 }]);
  });
  it("keeps the centered default and fixed anchors outside editable items", () => {
    const state = initialLayout();
    expect(state.composition).toBe("centered");
    expect(state.items.map((x) => x.kind)).toEqual(["search", "qr"]);
    expect(state.items.map((x) => x.zone)).toEqual(["left", "right"]);
    for (const id of ["office", "notebook"])
      expect(reduceLayout(state, { type: "remove", id })).toEqual(state);
    expect(compositions.length).toBeLessThanOrEqual(3);
  });
  it("moves and reorders by stable id, without losing dimensions", () => {
    let state = reduceLayout(initialLayout(), {
      type: "add",
      kind: "generic",
      size: "small",
    });
    const item = state.items.at(-1)!;
    state = reduceLayout(state, {
      type: "move",
      id: item.id,
      zone: "left",
      before: "search-1",
    });
    expect(
      state.items.filter((x) => x.zone === "left").map((x) => x.id),
    ).toEqual([item.id, "search-1"]);
    state = reduceLayout(state, { type: "step", id: item.id, direction: 1 });
    expect(
      state.items.filter((x) => x.zone === "left").map((x) => x.id),
    ).toEqual(["search-1", item.id]);
    expect(state.items.find((x) => x.id === item.id)?.size).toBe("small");
  });
  it("bounds resize by content and permits removing optional items only", () => {
    let state = reduceLayout(initialLayout(), {
      type: "resize",
      id: "search-1",
      size: "small",
      height: 20,
    });
    expect(state.items[0].size).toBe("medium");
    expect(state.items[0].height).toBe(dimensions.search.minHeight);
    state = reduceLayout(state, {
      type: "resize",
      id: "qr-2",
      size: "large",
      height: 5000,
    });
    expect(state.items[1].height).toBe(dimensions.qr.maxHeight);
    expect(
      reduceLayout(state, { type: "remove", id: "qr-2" }).items,
    ).toHaveLength(1);
  });
  it("changes composition without replacing items and resets predictably", () => {
    const state = reduceLayout(initialLayout(), {
      type: "resize",
      id: "search-1",
      size: "large",
      height: 360,
    });
    const staggered = reduceLayout(state, {
      type: "composition",
      value: "staggered",
    });
    expect(staggered.items).toEqual(state.items);
    expect(staggered.composition).toBe("staggered");
    expect(reduceLayout(staggered, { type: "reset" })).toEqual(initialLayout());
  });
});
