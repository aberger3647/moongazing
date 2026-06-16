import { useEffect, useMemo, useState, type CSSProperties } from "react";

// A believable deep-night sky. Depth is faked with three parallax layers (near =
// larger/brighter/faster, far = smaller/dimmer/slower); stars carry real colour
// temperature (cool blue-white → white → warm amber) and shimmer by opacity only
// so they never balloon. A moon-glow lights the upper sky, a faint Milky Way adds
// depth, and the brightest stars wear soft diffraction spikes. Pure CSS, no deps —
// except the occasional shooting star, the one scheduled "moment" of delight.

// Weighted toward white; a minority run cool or warm, like a real field.
const STAR_COLORS = [
  "#ffffff", "#ffffff", "#ffffff", "#f3f6ff", // white / near-white (common)
  "#d3deff", "#c0d1ff",                         // cool blue-white (hot stars)
  "#fff3da", "#ffe6c4",                         // warm white → amber (cool stars)
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => min + Math.random() * (max - min);

// 8-digit-hex alpha glow, scaled to the star's size and tinted to its colour.
const glow = (size: number, color: string) =>
  `0 0 ${(size * 1.6).toFixed(1)}px ${(size * 0.5).toFixed(1)}px ${color}59,` +
  `0 0 ${(size * 3.6).toFixed(1)}px ${(size * 1.2).toFixed(1)}px ${color}2b`;

interface LayerSpec {
  count: number;
  minSize: number;
  maxSize: number;
  minFloor: number; // twinkle opacity floor (how dark it dips)
  maxFloor: number;
  glowChance: number;
  px: string;
  py: string;
  pdur: string;
}

const LAYERS: LayerSpec[] = [
  // far: many tiny dim stars, barely drift, dip darkest
  { count: 70, minSize: 0.8, maxSize: 1.6, minFloor: 0.18, maxFloor: 0.32, glowChance: 0, px: "5px", py: "7px", pdur: "120s" },
  // mid
  { count: 45, minSize: 1.4, maxSize: 2.4, minFloor: 0.34, maxFloor: 0.5, glowChance: 0.25, px: "13px", py: "16px", pdur: "80s" },
  // near: fewer, bigger, brighter, faster, soft glow
  { count: 22, minSize: 2.2, maxSize: 3.4, minFloor: 0.5, maxFloor: 0.7, glowChance: 1, px: "26px", py: "30px", pdur: "52s" },
];

// A handful of hero stars carry diffraction spikes and barely twinkle.
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
  glow: boolean;
  bright: boolean;
  gdur?: string;
}

const makeStars = (spec: LayerSpec, seed: number): Star[] =>
  Array.from({ length: spec.count }, (_, i) => {
    const size = rand(spec.minSize, spec.maxSize);
    return {
      id: seed + i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size,
      color: pick(STAR_COLORS),
      floor: rand(spec.minFloor, spec.maxFloor),
      tdur: `${rand(2.6, 6).toFixed(2)}s`,
      tdelay: `${(-Math.random() * 6).toFixed(2)}s`,
      glow: Math.random() < spec.glowChance,
      bright: false,
    };
  });

const makeBrightStars = (seed: number): Star[] =>
  Array.from({ length: BRIGHT_COUNT }, (_, i) => {
    const size = rand(3, 4.2);
    return {
      id: seed + i,
      top: `${rand(6, 88)}%`,
      left: `${rand(4, 96)}%`,
      size,
      color: pick(STAR_COLORS),
      floor: rand(0.72, 0.85), // hero stars hold steady
      tdur: `${rand(5, 9).toFixed(2)}s`,
      tdelay: `${(-Math.random() * 6).toFixed(2)}s`,
      glow: true,
      bright: true,
      gdur: `${rand(5, 9).toFixed(2)}s`,
    };
  });

const starStyle = (s: Star): CSSProperties =>
  ({
    top: s.top,
    left: s.left,
    width: `${s.size}px`,
    height: `${s.size}px`,
    backgroundColor: s.color,
    boxShadow: s.glow ? glow(s.size, s.color) : undefined,
    "--tmin": s.floor,
    "--tdur": s.tdur,
    "--tdelay": s.tdelay,
    ...(s.bright
      ? { "--sc": s.color, "--spike": `${Math.round(s.size * 7)}px`, "--gdur": s.gdur }
      : {}),
  } as CSSProperties);

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
    []
  );
  const brightStars = useMemo(() => makeBrightStars(9000), []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Moonlight washing the upper sky — the light source for everything below. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 42% at 50% 14%, rgba(216,225,255,0.18), rgba(210,220,255,0.06) 44%, transparent 70%)",
        }}
      />

      {layers.map(({ spec, stars }, li) => (
        <div
          key={li}
          className="parallax-layer absolute inset-0"
          style={{ "--px": spec.px, "--py": spec.py, "--pdur": spec.pdur } as CSSProperties}
        >
          {stars.map((s) => (
            <span key={s.id} className="star-twinkle absolute rounded-full" style={starStyle(s)} />
          ))}
          {/* Hero stars live in the near layer so they drift with the foreground. */}
          {li === LAYERS.length - 1 &&
            brightStars.map((s) => (
              <span
                key={s.id}
                className="star-twinkle star-bright absolute rounded-full"
                style={starStyle(s)}
              />
            ))}
        </div>
      ))}

      <ShootingStars />
    </div>
  );
};
