import { StrictMode, useEffect } from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOfficeClock } from "./useOfficeClock";

let visibility: DocumentVisibilityState;
let observers: Set<MockIntersectionObserver>;

class MockIntersectionObserver {
  private target: Element | null = null;
  constructor(private callback: IntersectionObserverCallback) { observers.add(this); }
  observe(target: Element) { this.target = target; }
  disconnect() { this.target = null; observers.delete(this); }
  show(visible: boolean) {
    if (this.target) this.callback([{ target: this.target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

function Probe({ paused = false, onFrame }: { paused?: boolean; onFrame?: (time: number) => void }) {
  const { elapsedMs, running, ref } = useOfficeClock({ paused });
  useEffect(() => { onFrame?.(elapsedMs); }, [elapsedMs, onFrame]);
  return <div ref={ref} data-testid="clock" data-running={running}>{elapsedMs}</div>;
}

const elapsed = () => Number(screen.getByTestId("clock").textContent);
const running = () => screen.getByTestId("clock").dataset.running === "true";
const advance = (milliseconds: number) => act(() => { vi.advanceTimersByTime(milliseconds); });
const intersect = (visible: boolean) => act(() => { for (const observer of observers) observer.show(visible); });
const setVisibility = (value: DocumentVisibilityState) => act(() => {
  visibility = value;
  document.dispatchEvent(new Event("visibilitychange"));
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  visibility = "visible";
  observers = new Set();
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

describe("office active-time clock", () => {
  it("starts at zero and publishes at most twelve frames per second", () => {
    const frames: number[] = [];
    render(<Probe onFrame={(time) => frames.push(time)} />);
    expect(elapsed()).toBe(0);
    intersect(true);
    // Separate advances let React commit each timer update.
    for (let step = 0; step < 100; step++) advance(10);
    expect(running()).toBe(true);
    expect(elapsed()).toBeGreaterThanOrEqual(900);
    expect(elapsed()).toBeLessThanOrEqual(1000);
    expect(frames.filter((time) => time > 0).length).toBeLessThanOrEqual(12);
  });

  it("freezes while paused and resumes without counting the paused time", () => {
    const view = render(<Probe />);
    intersect(true);
    advance(500);
    view.rerender(<Probe paused />);
    const stopped = elapsed();
    advance(30_000);
    expect(elapsed()).toBe(stopped);
    expect(running()).toBe(false);
    view.rerender(<Probe />);
    advance(200);
    expect(running()).toBe(true);
    expect(elapsed() - stopped).toBeGreaterThan(100);
    expect(elapsed() - stopped).toBeLessThanOrEqual(200);
  });

  it("does not count time spent in a hidden tab", () => {
    render(<Probe />);
    intersect(true);
    advance(400);
    setVisibility("hidden");
    const stopped = elapsed();
    advance(60_000);
    expect(elapsed()).toBe(stopped);
    expect(running()).toBe(false);
    setVisibility("visible");
    advance(200);
    expect(elapsed() - stopped).toBeGreaterThan(100);
    expect(elapsed() - stopped).toBeLessThanOrEqual(200);
  });

  it("waits until the scene is visible, then freezes whenever it leaves the viewport", () => {
    render(<Probe />);
    advance(10_000);
    expect(elapsed()).toBe(0);
    expect(running()).toBe(false);
    intersect(true);
    advance(400);
    intersect(false);
    const stopped = elapsed();
    advance(20_000);
    expect(elapsed()).toBe(stopped);
    expect(running()).toBe(false);
    intersect(true);
    advance(200);
    expect(elapsed() - stopped).toBeGreaterThan(100);
    expect(elapsed() - stopped).toBeLessThanOrEqual(200);
  });

  it("stays stopped when one visibility condition recovers but another still blocks it", () => {
    const view = render(<Probe paused />);
    intersect(true);
    setVisibility("hidden");
    view.rerender(<Probe />);
    advance(2000);
    expect(elapsed()).toBe(0);
    intersect(false);
    setVisibility("visible");
    advance(2000);
    expect(elapsed()).toBe(0);
    intersect(true);
    advance(200);
    expect(elapsed()).toBeGreaterThan(100);
  });

  it("runs without IntersectionObserver and cleans up timers and observers on unmount", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const fallback = render(<Probe />);
    advance(200);
    expect(elapsed()).toBeGreaterThan(100);
    fallback.unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    const view = render(<StrictMode><Probe /></StrictMode>);
    intersect(true);
    advance(200);
    expect(elapsed()).toBeGreaterThan(100);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(observers.size).toBe(0);
    setVisibility("hidden");
    setVisibility("visible");
    expect(vi.getTimerCount()).toBe(0);
  });
});
