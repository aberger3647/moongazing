import { useId, type CSSProperties } from "react";

// An accurate, flat-vector moon. Instead of one of eight bucketed phase images, this
// draws the *exact* illuminated fraction for a phase value in [0, 1) — the same number
// Visual Crossing reports — so the moon you see is the moon that's up. The terminator
// is pure geometry (no astronomy library): the lit region is a half-disc limb plus a
// half-ellipse terminator whose width tracks the phase. The art matches the existing
// SVG moons exactly — flat, crisp, no glow: a dark indigo disc, a gold lit shape, and
// the lunar "seas" (maria) drawn once in each tone so they stay continuous across the
// terminator (gold where lit, indigo where shadowed), the one honest sign of relief.

const R = 63.7; // disc radius on a 128×128 grid (matches /public/*_moon.svg)
const C = 64; // centre

const DARK = "#3e31a4"; // shadowed disc (new_moon.svg .st1)
const DARK_MARE = "#3e43b2"; // seas on the shadowed side (.st3)
const LIT = "#ffe8a6"; // illuminated disc (.st2 / moon gold)
const LIT_MARE = "#f4dc9f"; // seas on the lit side (.st0)

// The fixed lunar seas, lifted from the existing flat moon art (full_moon.svg) so the
// computed moon carries the same character as the hand-drawn set.
const MARIA: ReadonlyArray<readonly [cx: number, cy: number, r: number]> = [
  [102.2, 70.9, 14.9],
  [34.5, 78.9, 12.7],
  [47.3, 102.3, 19.1],
  [47, 32.7, 8.5],
  [74.6, 34.8, 8.5],
  [21.8, 51.1, 8.5],
  [78.8, 15.7, 4.2],
  [13.3, 78.9, 4.2],
  [106.4, 102.3, 4.2],
  [49.1, 59.6, 6.4],
  [27.9, 29.5, 4.2],
  [93.7, 107.8, 8.5],
  [57.9, 18.9, 10.6],
];

// The illuminated-region path for phase p ∈ [0, 1), or null near new moon (no lit area).
// Northern-hemisphere convention: waxing (p < 0.5) lights the right limb, waning the
// left. The lit outline is the lit-side limb (a semicircle) plus the terminator (a
// half-ellipse of half-width |R·cos 2πp| that narrows to a straight line at the
// quarters and bows out to the far limb at full).
export const moonLitPath = (p: number): string | null => {
  const t = 2 * Math.PI * p;
  const lit = (1 - Math.cos(t)) / 2; // 0 = new, 1 = full
  if (lit < 0.004) return null; // new moon: no illuminated region to draw
  const rx = R * Math.cos(t); // signed terminator half-width
  const ax = Math.abs(rx);
  const waxing = p < 0.5;
  const limb = waxing ? 1 : 0; // outer limb on the lit side (right / left)
  const term = waxing ? (rx >= 0 ? 0 : 1) : rx >= 0 ? 1 : 0; // crescent bows in / gibbous bows out
  const top = `${C} ${C - R}`;
  const bot = `${C} ${C + R}`;
  return `M ${top} A ${R} ${R} 0 0 ${limb} ${bot} A ${ax} ${R} 0 0 ${term} ${top} Z`;
};

interface MoonDiscProps {
  /** Lunar phase in [0, 1): 0/1 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. */
  phase: number;
  className?: string;
  style?: CSSProperties;
}

export const MoonDisc = ({ phase, className, style }: MoonDiscProps) => {
  const clipId = useId();
  const p = ((phase % 1) + 1) % 1; // wrap any input into [0, 1)
  const litPath = moonLitPath(p);

  return (
    <svg
      viewBox="0 0 128 128"
      className={["moon-rise", className].filter(Boolean).join(" ")}
      style={style}
      aria-hidden="true"
    >
      {litPath && (
        <defs>
          <clipPath id={clipId}>
            <path d={litPath} />
          </clipPath>
        </defs>
      )}

      {/* Shadowed base: the whole disc and its seas, always present. */}
      <circle cx={C} cy={C} r={R} fill={DARK} />
      {MARIA.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={DARK_MARE} />
      ))}

      {/* Illuminated region painted over the shadow, with its seas clipped to it so
          each sea is gold where lit and stays indigo where it crosses into shadow. */}
      {litPath && (
        <>
          <path d={litPath} fill={LIT} />
          <g clipPath={`url(#${clipId})`}>
            {MARIA.map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill={LIT_MARE} />
            ))}
          </g>
        </>
      )}
    </svg>
  );
};
