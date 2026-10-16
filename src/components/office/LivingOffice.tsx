import { useEffect, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { usePreferences } from "../../app/PreferencesProvider";
import { sampleOffice, type OfficeActorId, type OfficeActorSnapshot } from "./office-activity";
import { useOfficeClock } from "./useOfficeClock";
import room from "./assets/office-room.webp";
import seated from "./assets/office-seated.webp";
import walking from "./assets/office-walk.webp";
import laptop from "./assets/office-laptop.webp";
import "./LivingOffice.css";

type Point = { x: number; y: number; size: number };
const DESKS: Record<OfficeActorId, Point & { column: number }> = {
  front: { x: 15.2, y: 92, size: 12.8, column: 0 },
  back: { x: 32.5, y: 70, size: 8.7, column: 1 },
  right: { x: 88.8, y: 82, size: 11.4, column: 2 },
  lounge: { x: 69.7, y: 104, size: 11, column: 0 },
};
const AISLE: Record<OfficeActorId, Point[]> = {
  front: [{ x: 17, y: 90, size: 12.8 }, { x: 25, y: 82, size: 10.8 }, { x: 34, y: 78, size: 9.4 }],
  back: [{ x: 33, y: 73, size: 8.7 }, { x: 38, y: 80, size: 9 }],
  right: [{ x: 87, y: 84, size: 11.4 }, { x: 82, y: 77, size: 10 }, { x: 78, y: 68, size: 8.6 }, { x: 66, y: 64, size: 7.5 }, { x: 51, y: 66, size: 7.5 }],
  lounge: [],
};
const DESTINATIONS: Record<"coffee" | "window", Point> = {
  coffee: { x: 45.5, y: 76, size: 8.4 },
  window: { x: 57, y: 62, size: 6.8 },
};
const MUGS = {
  front: { left: "14%", top: "75.8%", zIndex: 42 },
  back: { left: "25.4%", top: "54.5%", zIndex: 16 },
  right: { left: "86%", top: "64.5%", zIndex: 42 },
};

function position(actor: OfficeActorSnapshot): Point {
  if (!actor.away || !actor.destination) return DESKS[actor.id];
  const path = [...AISLE[actor.id], DESTINATIONS[actor.destination]];
  const at = actor.routeProgress * (path.length - 1);
  const index = Math.min(Math.floor(at), path.length - 2);
  const mix = at - index;
  const a = path[index], b = path[index + 1];
  return { x: a.x + (b.x - a.x) * mix, y: a.y + (b.y - a.y) * mix, size: a.size + (b.size - a.size) * mix };
}

function sprite(actor: OfficeActorSnapshot): CSSProperties {
  if (actor.id === "lounge") return { backgroundImage: `url(${laptop})` };
  if (!actor.away) {
    const row = actor.activity === "sip" ? (actor.frame === 1 || actor.frame === 2 ? 3 : 2) : actor.frame % 2;
    return {
      backgroundImage: `url(${seated})`, backgroundSize: "300% 400%",
      backgroundPosition: `${DESKS[actor.id].column * 50}% ${row * 100 / 3}%`,
    };
  }
  const column = actor.activity === "walk" ? actor.frame : actor.activity === "window" ? 2 : actor.frame === 1 || actor.frame === 2 ? 1 : 0;
  return {
    backgroundImage: `url(${walking})`, backgroundSize: "400% 200%",
    backgroundPosition: `${column * 100 / 3}% ${actor.activity === "walk" ? 0 : 100}%`,
  };
}

function Worker({ actor }: { actor: OfficeActorSnapshot }) {
  const at = position(actor);
  // Facing follows travel direction, including the returning half of the route.
  const [previous, setPrevious] = useState(actor.routeProgress);
  const [returning, setReturning] = useState(false);
  useEffect(() => {
    if (actor.routeProgress !== previous) {
      setReturning(actor.routeProgress < previous);
      setPrevious(actor.routeProgress);
    }
  }, [actor.routeProgress, previous]);
  const flip = actor.away
    ? actor.activity === "walk" && ((actor.id === "right") !== returning)
    : actor.id === "back";
  const style = {
    left: `${at.x}%`, top: `${at.y}%`, width: `${at.size}%`,
    zIndex: actor.id === "lounge" ? 50 : actor.away ? (actor.destination === "window" && actor.routeProgress > .82 ? 11 : 30) : actor.id === "back" ? 10 : 20,
    "--actor-delay": `${-Object.keys(DESKS).indexOf(actor.id) * 1.27}s`,
  } as CSSProperties;
  return <div className="office-actor" data-office-actor={actor.id} data-activity={actor.activity} data-away={actor.away} style={style}>
    {actor.away && <span className="office-foot-shadow" />}
    <div className="office-facing" data-flip={flip}>
      <div className="office-sprite" style={sprite(actor)} />
    </div>
  </div>;
}

function Scenery({ layer = "room" }: { layer?: string }) {
  return <div className={`office-scenery office-scenery--${layer}`}>
    <div className="office-environment office-environment--day" />
    <div className="office-environment office-environment--night" />
  </div>;
}

export function LivingOffice() {
  const { resolvedTheme, reducedMotion } = usePreferences();
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const { elapsedMs, running, ref } = useOfficeClock({ paused: paused || reducedMotion });
  const actors = sampleOffice(reducedMotion ? 0 : elapsedMs).actors;

  useEffect(() => {
    let current = true;
    setReady(false);
    setLoadFailed(false);
    const images = [room, seated, walking, laptop].map(src => new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = src;
    }));
    void Promise.all(images).then(results => {
      if (!current) return;
      const loaded = results.every(Boolean);
      setReady(loaded);
      setLoadFailed(!loaded);
    });
    return () => { current = false; };
  }, [loadAttempt]);

  return <div ref={ref} className="living-office" role="region" aria-label="Axolotlí office"
    data-theme={resolvedTheme} data-running={running} data-ready={ready} data-reduced-motion={reducedMotion}
    style={{ "--office-room": `url(${room})` } as CSSProperties}>
    <div className="office-art" aria-hidden="true">
      <div className="office-stage">
        <Scenery />
        {actors.map(actor => <Worker key={actor.id} actor={actor} />)}
        <Scenery layer="back-desk" />
        <Scenery layer="sofa" />
        <Scenery layer="beanbag" />
        <Scenery layer="front-desk" />
        <Scenery layer="right-desk" />
        {actors.filter(actor => actor.id !== "lounge" && actor.activity !== "sip").map(actor =>
          <div key={actor.id} className="office-desk-mug" data-office-mug={actor.id} style={MUGS[actor.id as keyof typeof MUGS]}><span>O<sub>2</sub></span></div>
        )}
        <div className="office-lamp-glow" />
        <div className="office-coffee-steam"><i /><i /><i /></div>
      </div>
    </div>
    {loadFailed && <div className="office-load-error" role="status">
      <span>Office se nepodařilo načíst.</span>
      <button type="button" onClick={() => setLoadAttempt(value => value + 1)}>Načíst znovu</button>
    </div>}
    <button className="office-motion-control" type="button" disabled={reducedMotion}
      aria-label={paused || reducedMotion ? "Pustit office" : "Pozastavit office"}
      title={reducedMotion ? "Animace jsou omezené v nastavení Vzhledu" : paused ? "Pustit office" : "Pozastavit office"}
      onClick={() => setPaused(value => !value)}>
      {paused || reducedMotion ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
    </button>
  </div>;
}
