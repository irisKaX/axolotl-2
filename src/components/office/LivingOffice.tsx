import { useEffect, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { usePreferences } from "../../app/PreferencesProvider";
import { sampleOffice, type OfficeActorId, type OfficeActorSnapshot } from "./office-activity";
import { useOfficeClock } from "./useOfficeClock";
import room from "./assets/office-room-v2.webp";
import seated from "./assets/office-seated-v2.webp";
import bodies from "./assets/office-bodies.webp";
import laptop from "./assets/office-laptop.webp";
import mug from "./assets/office-mug.webp";
import "./LivingOffice.css";

type Point = { x: number; y: number; size: number };
const DESKS: Record<OfficeActorId, Point & { column: number }> = {
  front: { x: 15.2, y: 92, size: 12.8, column: 1 },
  back: { x: 32.5, y: 63.5, size: 8.7, column: 1 },
  right: { x: 88.8, y: 80, size: 11.4, column: 0 },
  lounge: { x: 69.7, y: 104, size: 11, column: 0 },
};


function sprite(id: OfficeActorId, row = 0): CSSProperties {
  if (id === "lounge") return { backgroundImage: `url(${laptop})` };
  return {
    backgroundImage: `url(${seated})`, backgroundSize: "200% 400%",
    backgroundPosition: `${DESKS[id].column * 100}% ${row * 100 / 3}%`,
  };
}

function smooth(value: number): number {
  const bounded = Math.max(0, Math.min(1, value));
  return bounded * bounded * (3 - 2 * bounded);
}

/** Raise, hold, and put the object back without ever changing the body frame. */
function breakPose(progress: number): number {
  return smooth(progress / .25) * smooth((1 - progress) / .25);
}

function Worker({ actor, elapsedMs }: { actor: OfficeActorSnapshot; elapsedMs: number }) {
  const at = DESKS[actor.id];
  const lounge = actor.id === "lounge";
  const left = at.column === 1;
  const breaking = actor.activity === "sip" || actor.activity === "phone";
  const pose = breaking ? breakPose(actor.actionProgress) : 0;
  const fade = breaking ? smooth(actor.actionProgress / .09) * smooth((1 - actor.actionProgress) / .09) : 0;
  const offset = Object.keys(DESKS).indexOf(actor.id) * 1.71;
  // Only fingertips move. Every head, torso and pair of feet uses the same
  // background position for the lifetime of its actor.
  const tap = (phase: number) => -.72 * Math.max(0, Math.sin(elapsedMs / 165 + offset + phase));
  const handStyle = (near: boolean): CSSProperties => ({
    ...sprite(actor.id),
    transform: `translateY(${(breaking ? 0 : tap(near ? 0 : 2.1)).toFixed(3)}px)`,
    opacity: breaking && (lounge || (actor.activity === "sip" ? near : !near)) ? 1 - fade : 1,
  });
  const actionStyle: CSSProperties = {
    ...sprite(actor.id, actor.activity === "sip" ? 2 : 3),
    transform: `rotate(${((left ? -1 : 1) * (actor.activity === "sip" ? 20 : 28) * (1 - pose)).toFixed(3)}deg)`,
    opacity: fade,
  };
  const style = {
    left: `${at.x}%`, top: `${at.y}%`, width: `${at.size}%`,
    zIndex: lounge ? 50 : actor.id === "back" ? 10 : 20,
  } as CSSProperties;
  return <><div className="office-actor" data-office-actor={actor.id} data-activity={actor.activity}
    data-away={false} data-facing={left ? "left" : "right"} style={style}>
    <div className="office-character">
      <div className="office-sprite office-body" data-office-body={actor.id}
        style={lounge ? sprite(actor.id) : { ...sprite(actor.id), backgroundImage: `url(${bodies})` }} />
      {!lounge && <>
        <div className="office-sprite office-resting-arm office-resting-arm--near" style={{ ...sprite(actor.id), opacity: actor.activity === "sip" ? 1 - fade : 1 }} />
        <div className="office-sprite office-resting-arm office-resting-arm--far" style={{ ...sprite(actor.id), opacity: actor.activity === "phone" ? 1 - fade : 1 }} />
      </>}
      <div className="office-sprite office-hand office-hand--near" data-office-hand="near" style={handStyle(true)} />
      {!lounge && <div className="office-sprite office-hand office-hand--far" data-office-hand="far" style={handStyle(false)} />}
      {breaking && !lounge && <div className={`office-sprite office-action office-action--${actor.activity}`}
        data-office-hand="action" style={actionStyle} />}
      {lounge && actor.activity === "phone" && <div className="office-lounge-action" style={{
        opacity: fade, transform: `translateY(${(-pose).toFixed(3)}px) rotate(${(-pose).toFixed(3)}deg)`,
      }}>
        <span className="office-lounge-phone" />
      </div>}
    </div>
  </div>
    {!lounge && <div className="office-actor office-cup-holder" data-facing={left ? "left" : "right"}
      style={{ ...style, zIndex: actor.id === "back" ? 16 : 42 }}>
      <div className="office-character">
        <div className="office-cup" data-office-cup={actor.id}
          data-office-mug={actor.activity === "sip" ? undefined : actor.id}
          style={{ transform: `rotate(${((left ? -1 : 1) * 20 * (1 - (actor.activity === "sip" ? pose : 0))).toFixed(3)}deg)` }}>
          <span className="office-cup-object" style={{ backgroundImage: `url(${mug})` }} />
        </div>
      </div>
    </div>}
  </>;
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
  const activeTime = reducedMotion ? 0 : elapsedMs;
  const actors = sampleOffice(activeTime).actors;

  useEffect(() => {
    let current = true;
    setReady(false);
    setLoadFailed(false);
    const images = [room, seated, bodies, laptop, mug].map(src => new Promise<boolean>((resolve) => {
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
        {actors.map(actor => <Worker key={actor.id} actor={actor} elapsedMs={activeTime} />)}
        <Scenery layer="back-desk" />
        <Scenery layer="sofa" />
        <Scenery layer="beanbag" />
        <Scenery layer="front-desk" />
        <Scenery layer="right-desk" />
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
