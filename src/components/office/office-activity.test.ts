import { describe, expect, it } from "vitest";
import { sampleOffice, type OfficeActorId } from "./office-activity";

const actorAt = (time: number, id: OfficeActorId = "front") => sampleOffice(time).actors.find((actor) => actor.id === id)!;

describe("stationary office activity", () => {
  it("starts with three seated workers and an active laptop in the lounge", () => {
    expect(sampleOffice(0).actors).toEqual([
      { id: "front", activity: "work", frame: 0, actionProgress: 0, away: false, routeProgress: 0, destination: null },
      { id: "back", activity: "work", frame: 0, actionProgress: 0, away: false, routeProgress: 0, destination: null },
      { id: "right", activity: "work", frame: 0, actionProgress: 0, away: false, routeProgress: 0, destination: null },
      { id: "lounge", activity: "laptop", frame: 0, actionProgress: 0, away: false, routeProgress: 0, destination: null },
    ]);
  });

  it("introduces small seated actions early, including a phone check in the lounge", () => {
    expect(actorAt(6_000).activity).toBe("sip");
    expect(actorAt(16_500).activity).toBe("work");
    expect(actorAt(20_000, "lounge").activity).toBe("phone");
    expect(actorAt(55_000).activity).toBe("phone");
  });

  it("keeps all four actors seated through repeated cycles with rare staggered breaks", () => {
    const activities = new Map<OfficeActorId, Set<string>>();
    const workingSamples = new Map<OfficeActorId, number>();
    let samples = 0;
    for (let time = 0; time < 540_000; time += 100) {
      samples++;
      const { actors } = sampleOffice(time);
      expect(actors).toHaveLength(4);
      expect(actors.filter(({ activity }) => activity === "sip" || activity === "phone").length).toBeLessThanOrEqual(1);
      for (const actor of actors) {
        expect(actor.away).toBe(false);
        expect(actor.routeProgress).toBe(0);
        expect(actor.destination).toBeNull();
        expect(["work", "sip", "phone", "laptop"]).toContain(actor.activity);
        expect(actor.actionProgress).toBeGreaterThanOrEqual(0);
        expect(actor.actionProgress).toBeLessThan(1);
        expect(Number.isInteger(actor.frame)).toBe(true);
        expect(actor.frame).toBeGreaterThanOrEqual(0);
        expect(actor.frame).toBeLessThanOrEqual(3);
        const seen = activities.get(actor.id) ?? new Set<string>();
        seen.add(actor.activity);
        activities.set(actor.id, seen);
        if (actor.activity === "work" || actor.activity === "laptop") {
          expect(actor.actionProgress).toBe(0);
          // Finger movement belongs to the renderer; do not swap full body poses.
          expect(actor.frame).toBe(0);
          workingSamples.set(actor.id, (workingSamples.get(actor.id) ?? 0) + 1);
        }
      }
    }
    for (const [id, seen] of activities) {
      const expected = id === "lounge" ? ["laptop", "phone"] : ["work", "sip", "phone"];
      expect([...seen].sort()).toEqual(expected.sort());
      expect(workingSamples.get(id)! / samples).toBeGreaterThan(0.9);
    }
  });

  it("exposes continuous progress for raising and returning a cup or phone", () => {
    const start = actorAt(6_000);
    expect(start.actionProgress).toBe(0);
    expect(start.frame).toBe(0);
    expect(actorAt(8_800).actionProgress).toBeCloseTo(0.5);
    expect(actorAt(8_800).frame).toBe(2);
    expect(actorAt(11_599).actionProgress).toBeCloseTo(1, 2);
    expect(actorAt(11_600)).toMatchObject({ activity: "work", actionProgress: 0, frame: 0 });
    expect(actorAt(57_100)).toMatchObject({ activity: "phone", actionProgress: 0.5, frame: 2 });
  });

  it("samples reproducibly and treats invalid or negative time as the initial scene", () => {
    for (const time of [-1, -Infinity, Infinity, NaN]) expect(sampleOffice(time)).toEqual(sampleOffice(0));
    const first = sampleOffice(55_100);
    sampleOffice(360_000);
    expect(sampleOffice(55_100)).toEqual(first);
    expect(sampleOffice(270_000)).toEqual(sampleOffice(0));
    expect(sampleOffice(325_100)).toEqual(first);
    for (const actor of sampleOffice(Number.MAX_VALUE).actors) {
      expect(Number.isFinite(actor.actionProgress)).toBe(true);
      expect(actor.away).toBe(false);
    }
  });
});
