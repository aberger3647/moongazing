import { useEffect, useMemo, useState, type CSSProperties } from "react";

// A vector night sky. Stars are crisp four-point sparkles — flat SVG shapes, no
// glow — carried on three parallax depth layers (near = larger/brighter/faster,
// far = smaller/dimmer/slower) and shimmering by opacity alone so they never
// balloon. Each gets one of four irregular twinkle paths (see index.css) plus its
// own duration and phase, so the field scintillates randomly rather than breathing
// in unison. The brightest few are simply larger and steadier. Pure SVG + CSS, no
// deps, except the occasional shooting star: the one scheduled moment of delight.

// Weighted toward white; a minority run cool or warm, like a real field.
const STAR_COLORS = [
  "#ffffff", "#ffffff", "#ffffff", "#f3f6ff",
  "#d3deff", "#c0d1ff",
  "#fff3da", "#ffe6c4",
];

// A concave four-point sparkle on a 24×24 grid.
const SPARKLE =
  "M12 0c.9 6.6 4.8 10.5 12 12-7.2 1.5-11.1 5.4-12 12-.9-6.6-4.8-10.5-12-12 7.2-1.5 11.1-5.4 12-12z";

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => min + Math.random() * (max - min);

// The four irregular twinkle keyframes defined in index.css (.tw-{a,b,c,d}).
const TWINKLES = ["a", "b", "c", "d"] as const;
type Twinkle = (typeof TWINKLES)[number];

interface LayerSpec {
  count: number;
  minSize: number;
  maxSize: number;
  minFloor: number; // twinkle opacity floor (how dark it dips)
  maxFloor: number;
  minDur: number; // twinkle cycle in seconds (full floor → flare → floor)
  maxDur: number;
  px: string;
  py: string;
  pdur: string;
}

// Faint, distant stars scintillate fastest — that brisk far-layer shimmer is what
// reads as "twinkling." Near/large stars cycle slowly so the eye-drawing ones stay
// calm and the sky feels alive without getting busy.
const LAYERS: LayerSpec[] = [
  // far: many tiny dim sparkles, barely drift, dip darkest, twinkle quickest
  { count: 42, minSize: 3, maxSize: 5, minFloor: 0.18, maxFloor: 0.32, minDur: 3.5, maxDur: 6.0, px: "5px", py: "7px", pdur: "120s" },
  // mid
  { count: 27, minSize: 5, maxSize: 8, minFloor: 0.34, maxFloor: 0.5, minDur: 4.5, maxDur: 7.5, px: "13px", py: "16px", pdur: "80s" },
  // near: fewer, bigger, brighter, drift most, twinkle slowest of the field
  { count: 14, minSize: 8, maxSize: 13, minFloor: 0.5, maxFloor: 0.7, minDur: 6.0, maxDur: 9.5, px: "26px", py: "30px", pdur: "52s" },
];

// A handful of hero sparkles sit larger and hold steady.
const BRIGHT_COUNT = 5;

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  color: string;
  floor: number;
  tdur: string;
  tdelay: string;
  twinkle: Twinkle;
  bright: boolean;
}

const makeStars = (spec: LayerSpec, seed: number): Star[] =>
  Array.from({ length: spec.count }, (_, i) => {
    // Each loop is floor → flare → floor, so the full cycle is one --tdur (no
    // alternate). Start each star at a random phase so nothing twinkles together.
    const dur = rand(spec.minDur, spec.maxDur);
    return {
      id: seed + i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: rand(spec.minSize, spec.maxSize),
      color: pick(STAR_COLORS),
      floor: rand(spec.minFloor, spec.maxFloor),
      tdur: `${dur.toFixed(2)}s`,
      tdelay: `${(-Math.random() * dur).toFixed(2)}s`,
      twinkle: pick(TWINKLES),
      bright: false,
    };
  });

const makeBrightStars = (seed: number): Star[] =>
  Array.from({ length: BRIGHT_COUNT }, (_, i) => {
    const dur = rand(9, 14); // hero stars swell slowly, but still visibly breathe
    return {
      id: seed + i,
      top: `${rand(6, 88)}%`,
      left: `${rand(4, 96)}%`,
      size: rand(15, 22),
      color: pick(STAR_COLORS),
      floor: rand(0.72, 0.85), // hero stars hold steady
      tdur: `${dur.toFixed(2)}s`,
      tdelay: `${(-Math.random() * dur).toFixed(2)}s`,
      twinkle: "d", // the broad, steady swell — never the flickery variants
      bright: true,
    };
  });

const Sparkle = ({ s }: { s: Star }) => (
  <svg
    className={`star-twinkle tw-${s.twinkle} absolute${s.bright ? " star-bright" : ""}`}
    style={
      {
        top: s.top,
        left: s.left,
        width: `${s.size}px`,
        height: `${s.size}px`,
        "--tmin": s.floor,
        "--tdur": s.tdur,
        "--tdelay": s.tdelay,
      } as CSSProperties
    }
    viewBox="0 0 24 24"
    fill={s.color}
    aria-hidden="true"
  >
    <path d={SPARKLE} />
  </svg>
);

// ---- Shooting stars: the one scheduled moment ----------------------------

interface Meteor {
  key: number;
  top: string;
  left: string;
  angle: string;
  flip: number; // 1 = left side (falls down-right), -1 = right side (mirrored)
  len: string;
  travel: string;
  dur: string;
}

const makeMeteor = (key: number): Meteor => {
  // Keep meteors off the centre and out along the left/right sides of the sky.
  // Left-side streaks fall down-right from the edge; right-side ones are mirrored
  // (flip: -1 → scaleX in CSS) so they fall down-left — a symmetric pair. Travel
  // is short so a streak stays on its side instead of sweeping across the middle.
  const right = Math.random() < 0.5;
  return {
    key,
    top: `${rand(2, 80).toFixed(1)}%`,
    left: right ? `${rand(80, 104).toFixed(1)}%` : `${rand(-8, 14).toFixed(1)}%`,
    angle: `${rand(12, 38).toFixed(1)}deg`,
    flip: right ? -1 : 1,
    len: `${Math.round(rand(120, 220))}px`,
    travel: `${Math.round(rand(18, 32))}vw`,
    dur: `${Math.round(rand(850, 1450))}ms`,
  };
};

const ShootingStars = () => {
  const [meteor, setMeteor] = useState<Meteor | null>(null);

  useEffect(() => {
    // Guard matchMedia: it's absent in jsdom/SSR and very old browsers.
    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let active = true;
    let showTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;
    let n = 0;

    const loop = () => {
      if (!active) return;
      showTimer = setTimeout(() => {
        setMeteor(makeMeteor(n++));
        clearTimer = setTimeout(() => {
          setMeteor(null);
          loop();
        }, 1600); // > max --mdur so the streak finishes before it unmounts
      }, rand(5000, 17000)); // 5–17s between meteors
    };
    loop();

    return () => {
      active = false;
      clearTimeout(showTimer);
      clearTimeout(clearTimer);
    };
  }, []);

  if (!meteor) return null;
  return (
    <div
      key={meteor.key}
      className="shooting-star"
      style={
        {
          top: meteor.top,
          left: meteor.left,
          "--mangle": meteor.angle,
          "--mflip": meteor.flip,
          "--mlen": meteor.len,
          "--mtravel": meteor.travel,
          "--mdur": meteor.dur,
        } as CSSProperties
      }
    >
      <span className="streak" />
    </div>
  );
};

// --------------------------------------------------------------------------

export const StarsBackground = () => {
  // Generate once for the app's lifetime so positions don't jump on re-render.
  const layers = useMemo(
    () => LAYERS.map((spec, i) => ({ spec, stars: makeStars(spec, i * 1000) })),
    [],
  );
  const brightStars = useMemo(() => makeBrightStars(9000), []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {layers.map(({ spec, stars }, li) => (
        <div
          key={li}
          className="parallax-layer absolute inset-0"
          style={{ "--px": spec.px, "--py": spec.py, "--pdur": spec.pdur } as CSSProperties}
        >
          {stars.map((s) => (
            <Sparkle key={s.id} s={s} />
          ))}
          {/* Hero sparkles live in the near layer so they drift with the foreground. */}
          {li === LAYERS.length - 1 &&
            brightStars.map((s) => <Sparkle key={s.id} s={s} />)}
        </div>
      ))}

      <ShootingStars />
    </div>
  );
};
