import { describe, expect, it } from "vitest";
import { sampleOffice } from "./office-activity";

describe("office activity", () => {
  it("starts with three seated workers and a working laptop in the lounge", () => {
    expect(sampleOffice(0).actors.map(({ id, activity, away, routeProgress, destination }) => ({ id, activity, away, routeProgress, destination }))).toEqual([
      { id: "front", activity: "work", away: false, routeProgress: 0, destination: null },
      { id: "back", activity: "work", away: false, routeProgress: 0, destination: null },
      { id: "right", activity: "work", away: false, routeProgress: 0, destination: null },
      { id: "lounge", activity: "laptop", away: false, routeProgress: 0, destination: null },
    ]);
  });

  it("shows a seated coffee break early and a first walk around sixteen seconds", () => {
    const earlyActions = Array.from({ length: 9 }, (_, second) => sampleOffice(second * 1000));
    expect(earlyActions.some(({ actors }) => actors.some((actor) => actor.activity === "sip" && !actor.away))).toBe(true);
    expect(sampleOffice(16_500).actors.some((actor) => actor.activity === "walk")).toBe(true);
  });

  it("lets each desk worker visit both destinations while only one worker is away", () => {
    const visits = new Map<string, Set<string>>();
    for (let time = 0; time < 540_000; time += 100) {
      const { actors } = sampleOffice(time);
      expect(actors.filter((actor) => actor.away).length).toBeLessThanOrEqual(1);
      expect(actors.find((actor) => actor.id === "lounge")?.activity).toBe("laptop");
      for (const actor of actors) {
        expect(actor.routeProgress).toBeGreaterThanOrEqual(0);
        expect(actor.routeProgress).toBeLessThanOrEqual(1);
        expect(Number.isInteger(actor.frame)).toBe(true);
        expect(actor.frame).toBeGreaterThanOrEqual(0);
        expect(actor.frame).toBeLessThanOrEqual(3);
        if (actor.away) {
          expect(actor.destination).not.toBeNull();
          const destinations = visits.get(actor.id) ?? new Set<string>();
          destinations.add(actor.destination!);
          visits.set(actor.id, destinations);
        } else {
          expect(actor.routeProgress).toBe(0);
          expect(actor.destination).toBeNull();
          expect(["work", "sip", "laptop"]).toContain(actor.activity);
        }
      }
    }
    expect([...visits.keys()].sort()).toEqual(["back", "front", "right"]);
    for (const destinations of visits.values()) expect([...destinations].sort()).toEqual(["coffee", "window"]);
  });

  it("keeps walking continuous through arrival, the visit, and return to the desk", () => {
    const getVisitor = (time: number) => sampleOffice(time).actors.find((actor) => actor.id === "front")!;
    const samples = Array.from({ length: 241 }, (_, index) => getVisitor(15_000 + index * 100));
    const away = samples.filter((actor) => actor.away);
    expect(away[0].routeProgress).toBeLessThan(0.02);
    expect(away.some((actor) => actor.activity === "coffee" && actor.routeProgress === 1)).toBe(true);
    expect(away.at(-1)!.routeProgress).toBeLessThan(0.02);
    expect(samples.at(-1)!.away).toBe(false);
    for (let index = 1; index < samples.length; index++) {
      expect(Math.abs(samples[index].routeProgress - samples[index - 1].routeProgress)).toBeLessThan(0.03);
    }
  });

  it("samples reproducibly and treats invalid or negative time as the initial scene", () => {
    for (const time of [-1, -Infinity, Infinity, NaN]) expect(sampleOffice(time)).toEqual(sampleOffice(0));
    const first = sampleOffice(28_100);
    sampleOffice(360_000);
    expect(sampleOffice(28_100)).toEqual(first);
    expect(sampleOffice(Number.MAX_VALUE).actors).toHaveLength(4);
  });
});
