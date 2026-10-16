export type OfficeActorId = "front" | "back" | "right" | "lounge";
export type OfficeActivity = "work" | "sip" | "walk" | "coffee" | "window" | "laptop";
export type OfficeDestination = "coffee" | "window";

export interface OfficeActorSnapshot {
  id: OfficeActorId;
  activity: OfficeActivity;
  frame: number;
  routeProgress: number;
  destination: OfficeDestination | null;
  away: boolean;
}

export interface OfficeSnapshot {
  actors: OfficeActorSnapshot[];
}

type DeskActorId = Exclude<OfficeActorId, "lounge">;

interface Visit {
  actor: DeskActorId;
  destination: OfficeDestination;
  start: number;
  travel: number;
  stay: number;
}

const CYCLE_MS = 270_000;
const ACTORS: OfficeActorId[] = ["front", "back", "right", "lounge"];

// One shared itinerary prevents overlapping visitors. Coordinates and facing
// belong to the renderer, so every layout can use the same activity timeline.
const VISITS: Visit[] = [
  { actor: "front", destination: "coffee", start: 16_000, travel: 6_000, stay: 7_000 },
  { actor: "back", destination: "window", start: 58_000, travel: 7_000, stay: 9_000 },
  { actor: "right", destination: "coffee", start: 101_000, travel: 6_000, stay: 7_000 },
  { actor: "front", destination: "window", start: 142_000, travel: 7_000, stay: 9_000 },
  { actor: "back", destination: "coffee", start: 185_000, travel: 6_000, stay: 7_000 },
  { actor: "right", destination: "window", start: 224_000, travel: 7_000, stay: 9_000 },
];

const SIPS: Record<DeskActorId, { first: number; period: number }> = {
  front: { first: 6_000, period: 43_000 },
  back: { first: 18_000, period: 51_000 },
  right: { first: 31_000, period: 57_000 },
};
const SIP_MS = 5_600;

/** A pure sample of active office time; invalid input yields a restful scene. */
export function sampleOffice(elapsedMs: number): OfficeSnapshot {
  const time = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) % CYCLE_MS : 0;
  const visit = VISITS.find(({ start, travel, stay }) => time >= start && time < start + travel * 2 + stay);

  return {
    actors: ACTORS.map((id, index): OfficeActorSnapshot => {
      if (visit?.actor === id) {
        const age = time - visit.start;
        const arriving = age < visit.travel;
        const returning = age >= visit.travel + visit.stay;
        const walking = arriving || returning;
        const routeProgress = arriving
          ? age / visit.travel
          : returning
            ? 1 - (age - visit.travel - visit.stay) / visit.travel
            : 1;
        return {
          id,
          activity: walking ? "walk" : visit.destination,
          // Four walk poses; during a coffee visit use low/high/high/low.
          frame: walking ? Math.floor(age / 200) % 4 : Math.floor((age - visit.travel) / (visit.stay / 4)),
          routeProgress,
          destination: visit.destination,
          away: true,
        };
      }

      const sip = id === "lounge" ? null : SIPS[id];
      const sipAge = sip && time >= sip.first ? (time - sip.first) % sip.period : SIP_MS;
      const sipping = sipAge < SIP_MS;
      return {
        id,
        activity: id === "lounge" ? "laptop" : sipping ? "sip" : "work",
        // Sip frames 0/3 are cup lowered; 1/2 are raised. Working actors have
        // independent phases, avoiding a synchronized office-wide pose change.
        frame: sipping ? Math.floor(sipAge / (SIP_MS / 4)) : Math.floor((time + index * 380) / (id === "lounge" ? 1_100 : 720)) % 4,
        routeProgress: 0,
        destination: null,
        away: false,
      };
    }),
  };
}
