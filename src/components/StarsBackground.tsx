import { useEffect, useMemo, useState, type CSSProperties } from "react";

// A vector night sky. Stars are crisp four-point sparkles — flat SVG shapes, no
// glow — carried on three parallax depth layers (near = larger/brighter/faster,
// far = smaller/dimmer/slower) and shimmering by opacity alone so they never
// balloon. The brightest few are simply larger and steadier. Pure SVG + CSS, no
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

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => min + Math.random() * (max - min);

interface LayerSpec {
  count: number;
  minSize: number;
  maxSize: number;
  minFloor: number; // twinkle opacity floor (how dark it dips)
  maxFloor: number;
  px: string;
  py: string;
  pdur: string;
}

const LAYERS: LayerSpec[] = [
  // far: many tiny dim sparkles, barely drift, dip darkest
  { count: 70, minSize: 3, maxSize: 5, minFloor: 0.18, maxFloor: 0.32, px: "5px", py: "7px", pdur: "120s" },
  // mid
  { count: 45, minSize: 5, maxSize: 8, minFloor: 0.34, maxFloor: 0.5, px: "13px", py: "16px", pdur: "80s" },
  // near: fewer, bigger, brighter, faster
  { count: 22, minSize: 8, maxSize: 13, minFloor: 0.5, maxFloor: 0.7, px: "26px", py: "30px", pdur: "52s" },
];

// A handful of hero sparkles sit larger and hold steady.
const BRIGHT_COUNT = 7;

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  color: string;
  floor: number;
  tdur: string;
  tdelay: string;
  bright: boolean;
}

const makeStars = (spec: LayerSpec, seed: number): Star[] =>
  Array.from({ length: spec.count }, (_, i) => ({
    id: seed + i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: rand(spec.minSize, spec.maxSize),
    color: pick(STAR_COLORS),
    floor: rand(spec.minFloor, spec.maxFloor),
    tdur: `${rand(2.6, 6).toFixed(2)}s`,
    tdelay: `${(-Math.random() * 6).toFixed(2)}s`,
    bright: false,
  }));

const makeBrightStars = (seed: number): Star[] =>
  Array.from({ length: BRIGHT_COUNT }, (_, i) => ({
    id: seed + i,
    top: `${rand(6, 88)}%`,
    left: `${rand(4, 96)}%`,
    size: rand(15, 22),
    color: pick(STAR_COLORS),
    floor: rand(0.72, 0.85), // hero stars hold steady
    tdur: `${rand(5, 9).toFixed(2)}s`,
    tdelay: `${(-Math.random() * 6).toFixed(2)}s`,
    bright: true,
  }));

const Sparkle = ({ s }: { s: Star }) => (
  <svg
    className={`star-twinkle absolute${s.bright ? " star-bright" : ""}`}
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
  len: string;
  travel: string;
  dur: string;
}

const makeMeteor = (key: number): Meteor => ({
  key,
  top: `${rand(2, 38)}%`,
  left: `${rand(-6, 58)}%`,
  angle: `${rand(14, 34).toFixed(1)}deg`,
  len: `${Math.round(rand(120, 230))}px`,
  travel: `${Math.round(rand(42, 72))}vw`,
  dur: `${Math.round(rand(850, 1450))}ms`,
});

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
