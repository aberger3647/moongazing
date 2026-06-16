import { useMemo, type CSSProperties } from "react";

// A full-page, always-on starfield. "3D" depth is faked with parallax: three
// layers drift by different amounts (near = larger/faster, far = smaller/slower),
// and each star twinkles independently. Pure CSS — no dependencies.

interface LayerSpec {
  count: number;
  minSize: number; // px
  maxSize: number; // px
  px: string; // parallax X drift
  py: string; // parallax Y drift
  pdur: string; // parallax duration
  glow: boolean;
}

const LAYERS: LayerSpec[] = [
  // far: many tiny stars, slow drift
  { count: 50, minSize: 1, maxSize: 1.5, px: "6px", py: "8px", pdur: "90s", glow: false },
  // mid
  { count: 40, minSize: 1.5, maxSize: 2.5, px: "14px", py: "18px", pdur: "60s", glow: false },
  // near: fewer, bigger, faster drift, soft glow
  { count: 30, minSize: 2.5, maxSize: 3.5, px: "28px", py: "34px", pdur: "40s", glow: true },
];

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  tdur: string;
  tdelay: string;
}

const makeStars = (spec: LayerSpec, seed: number): Star[] =>
  Array.from({ length: spec.count }, (_, i) => ({
    id: seed + i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: spec.minSize + Math.random() * (spec.maxSize - spec.minSize),
    tdur: `${2 + Math.random() * 3}s`, // 2–5s twinkle
    tdelay: `${-Math.random() * 5}s`, // negative → desync stars
  }));

export const StarsBackground = () => {
  // Generate once for the app's lifetime so positions don't jump on re-render.
  const layers = useMemo(
    () => LAYERS.map((spec, i) => ({ spec, stars: makeStars(spec, i * 1000) })),
    []
  );

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {layers.map(({ spec, stars }, li) => (
        <div
          key={li}
          className="parallax-layer absolute inset-0"
          style={{ "--px": spec.px, "--py": spec.py, "--pdur": spec.pdur } as CSSProperties}
        >
          {stars.map((s) => (
            <span
              key={s.id}
              className="star-twinkle absolute rounded-full bg-white"
              style={
                {
                  top: s.top,
                  left: s.left,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  boxShadow: spec.glow ? "0 0 4px 1px rgba(255,255,255,0.7)" : undefined,
                  "--tdur": s.tdur,
                  "--tdelay": s.tdelay,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
};
