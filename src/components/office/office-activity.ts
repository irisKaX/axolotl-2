export type OfficeActorId = "front" | "back" | "right" | "lounge";
export type OfficeActivity = "work" | "sip" | "phone" | "laptop";

export interface OfficeActorSnapshot {
  id: OfficeActorId;
  activity: OfficeActivity;
  frame: number;
  /** Normalized progress through a seated break; zero while working. */
  actionProgress: number;
  routeProgress: 0;
  destination: null;
  away: false;
}

export interface OfficeSnapshot {
  actors: OfficeActorSnapshot[];
}

interface SeatedBreak {
  actor: OfficeActorId;
  activity: "sip" | "phone";
  start: number;
}

const CYCLE_MS = 270_000;
const ACTORS: OfficeActorId[] = ["front", "back", "right", "lounge"];
const BREAK_DURATION = { sip: 5_600, phone: 4_200 } as const;

// Everyone stays at their workstation. Short, staggered breaks leave each
// character working for over 90% of the cycle, including the laptop sitter.
const BREAKS: SeatedBreak[] = [
  { actor: "front", activity: "sip", start: 6_000 },
  { actor: "lounge", activity: "phone", start: 20_000 },
  { actor: "back", activity: "sip", start: 36_000 },
  { actor: "front", activity: "phone", start: 55_000 },
  { actor: "right", activity: "sip", start: 76_000 },
  { actor: "back", activity: "phone", start: 123_000 },
  { actor: "front", activity: "sip", start: 150_000 },
  { actor: "right", activity: "phone", start: 177_000 },
  { actor: "lounge", activity: "phone", start: 203_000 },
  { actor: "back", activity: "sip", start: 229_000 },
  { actor: "right", activity: "sip", start: 252_000 },
];

/** A pure sample of active office time; invalid input yields the initial scene. */
export function sampleOffice(elapsedMs: number): OfficeSnapshot {
  const time = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) % CYCLE_MS : 0;
  const seatedBreak = BREAKS.find(({ start, activity }) => time >= start && time < start + BREAK_DURATION[activity]);

  return {
    actors: ACTORS.map((id): OfficeActorSnapshot => {
      const activeBreak = seatedBreak?.actor === id ? seatedBreak : null;
      const actionProgress = activeBreak ? (time - activeBreak.start) / BREAK_DURATION[activeBreak.activity] : 0;
      return {
        id,
        activity: activeBreak?.activity ?? (id === "lounge" ? "laptop" : "work"),
        // The renderer animates hands independently; the body keeps one pose.
        frame: activeBreak ? Math.floor(actionProgress * 4) : 0,
        actionProgress,
        routeProgress: 0,
        destination: null,
        away: false,
      };
    }),
  };
}
