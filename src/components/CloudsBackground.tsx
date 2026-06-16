import { useMemo, type CSSProperties } from "react";

// Weather-driven clouds. Count + overall opacity scale with the searched
// location's cloud cover (0–100). `null`/0 → clear sky (renders nothing).
// Puffs are placed at random positions and gently drift sideways, so disabling
// the animation (prefers-reduced-motion) still leaves them distributed.

const MAX_PUFFS = 8;

interface Puff {
  id: number;
  top: string;
  left: string;
  size: number; // px width (height is half → soft ellipse)
  opacity: number;
  cdur: string;
  cdelay: string;
}

const makePuffs = (cloudcover: number): Puff[] => {
  const count = Math.max(1, Math.round((cloudcover / 100) * MAX_PUFFS));
  return Array.from({ length: count }, (_, i) => {
    const dur = 45 + Math.random() * 45; // 45–90s drift
    return {
      id: i,
      top: `${5 + Math.random() * 70}%`,
      left: `${Math.random() * 90}%`,
      size: 160 + Math.random() * 220, // 160–380px
      opacity: 0.6 + Math.random() * 0.4, // 0.6–1.0 (multiplied by layer opacity)
      cdur: `${dur}s`,
      cdelay: `${-Math.random() * dur}s`, // negative → spread across the cycle
    };
  });
};

export const CloudsBackground = ({ cloudcover }: { cloudcover: number | null }) => {
  const puffs = useMemo(
    () => (cloudcover && cloudcover > 0 ? makePuffs(cloudcover) : []),
    [cloudcover]
  );

  if (puffs.length === 0) return null;

  // Overall layer opacity scales with cloud cover (≈0.15 clear → 0.6 overcast).
  const cc = Math.min(cloudcover ?? 0, 100);
  const layerOpacity = 0.15 + (cc / 100) * 0.45;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ opacity: layerOpacity }}
      aria-hidden="true"
    >
      {puffs.map((p) => (
        <div
          key={p.id}
          className="cloud-drift absolute rounded-full bg-white blur-2xl"
          style={
            {
              top: p.top,
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size * 0.5}px`,
              opacity: p.opacity,
              "--cdur": p.cdur,
              "--cdelay": p.cdelay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
};
