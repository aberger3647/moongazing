import { useMemo, type CSSProperties } from "react";

// Weather-driven vector clouds. Count, opacity and a sky-dimming veil all scale
// with the searched location's cloud cover (0–100): clear sky renders nothing;
// overcast genuinely hides the stars — because that is worse for viewing. Flat
// silhouettes, not soft haze: each cloud is a cluster of solid, opaque lobes that
// merge into one crisp shape (opaque so overlaps don't darken), with the whole
// cloud's transparency carried by the container so it sits believably on the sky.

const MAX_CLOUDS = 8;

// Flat moonlit-slate fill — one opaque tone so overlapping lobes read as a single
// silhouette instead of stacked, alpha-darkened rings.
const LOBE_FILL = "#3e4577";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

interface Lobe {
  dx: number;
  dy: number;
  w: number;
  h: number;
}

// A cluster of wide ellipses sharing a flat-ish base with a domed, lumpy top —
// the cumulus silhouette. Bigger lobes sit toward the centre.
const makeLobes = (): Lobe[] => {
  const n = 5 + Math.floor(Math.random() * 3); // 5–7 lobes
  const span = rand(150, 280); // tighter span → lobes overlap into one mass
  const peak = rand(78, 140); // tallest lobe height
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const bell = 0.4 + 0.6 * Math.sin(Math.PI * t); // small at the edges, tall mid
    const h = peak * (0.5 + 0.5 * bell) * rand(0.82, 1.12);
    const w = h * rand(1.9, 2.7); // wide, flat ellipse
    return {
      dx: (t - 0.5) * span + rand(-14, 14),
      dy: -h / 2 + rand(-12, 8), // share a baseline → flat bottom, lumpier top
      w,
      h,
    };
  });
};

interface Cloud {
  id: number;
  top: string;
  left: string;
  opacity: number;
  lobes: Lobe[];
  cdur: string;
  cdelay: string;
  cfrom: string;
  cto: string;
  cbob: string;
}

const makeClouds = (count: number, layerOpacity: number): Cloud[] =>
  Array.from({ length: count }, (_, i) => {
    const dur = 60 + Math.random() * 70; // 60–130s drift
    return {
      id: i,
      top: `${4 + Math.random() * 66}%`,
      left: `${Math.random() * 88}%`,
      opacity: Math.min(layerOpacity * rand(0.8, 1), 0.96),
      lobes: makeLobes(),
      cdur: `${dur.toFixed(0)}s`,
      cdelay: `${(-Math.random() * dur).toFixed(0)}s`, // negative → spread across the cycle
      cfrom: `${rand(-7, -2).toFixed(1)}vw`,
      cto: `${rand(2, 7).toFixed(1)}vw`,
      cbob: `${rand(-1.4, 1.4).toFixed(1)}vh`,
    };
  });

export const CloudsBackground = ({ cloudcover }: { cloudcover: number | null }) => {
  const cc = cloudcover && cloudcover > 0 ? Math.min(cloudcover, 100) : 0;

  // A veil dims the whole sky and an upper haze thickens into a star-swallowing
  // blanket only at high cover — both honest signals that viewing is worse.
  const veilOpacity = (cc / 100) * 0.42; // up to 0.42 indigo dimming at 100%
  const haze = Math.max(0, (cc - 40) / 60) ** 1.2 * 0.85; // past ~40% cover

  const clouds = useMemo(() => {
    if (cc === 0) return [];
    // Opacity climbs steeply so overcast really covers.
    const layerOpacity = 0.35 + (cc / 100) * 0.57; // 0.35 light → 0.92 overcast
    const count = Math.max(1, Math.round((cc / 100) * MAX_CLOUDS));
    return makeClouds(count, layerOpacity);
  }, [cc]);

  if (clouds.length === 0) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Dim the sky as cover rises — honest signal that viewing is worse. */}
      <div className="absolute inset-0" style={{ backgroundColor: "#0a0a23", opacity: veilOpacity }} />
      {/* Heavy cover thickens into an overcast blanket from the top, swallowing stars. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(56,61,104,0.95) 0%, rgba(52,57,100,0.6) 38%, transparent 70%)",
          opacity: haze,
        }}
      />

      {clouds.map((c) => (
        <div
          key={c.id}
          className="cloud-drift absolute"
          style={
            {
              top: c.top,
              left: c.left,
              opacity: c.opacity,
              "--cdur": c.cdur,
              "--cdelay": c.cdelay,
              "--cfrom": c.cfrom,
              "--cto": c.cto,
              "--cbob": c.cbob,
            } as CSSProperties
          }
        >
          {c.lobes.map((l, li) => (
            <span
              key={li}
              className="absolute block rounded-full"
              style={{
                width: `${l.w}px`,
                height: `${l.h}px`,
                transform: `translate(calc(-50% + ${l.dx}px), calc(-50% + ${l.dy}px))`,
                background: LOBE_FILL,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
