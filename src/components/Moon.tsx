import { FC } from "react";
import type { MoonPhase } from "../types/MoonPhase";

interface MoonProps {
  size?: number;
  color?: string;
  shadowColor?: string;
  className?: string;
  phase: MoonPhase;
}

export const Moon: FC<MoonProps> = ({
  size = 50,
  color = "#fcfcd7",
  shadowColor = "#2f0a8c",
  className,
  phase,
}) => {
  const getMask = () => {
    switch (phase) {
      case "New Moon":
        return (
          <mask id="moon-mask">
            <rect width="100" height="100" fill="white" />
          </mask>
        );
      case "Full Moon":
        return (
          <mask id="moon-mask">
            <rect width="100" height="100" fill="black" />
          </mask>
        );
      case "First Quarter":
        return (
          <mask id="moon-mask">
            <rect width="100" height="100" fill="black" />
            <rect x="50" y="0" width="50" height="100" fill="white" />
          </mask>
        );
      case "Last Quarter":
        return (
          <mask id="moon-mask">
            <rect width="100" height="100" fill="black" />
            <rect x="0" y="0" width="50" height="100" fill="white" />
          </mask>
        );
      case "Waxing Crescent":
        return (
          <mask id="moon-mask">
            <rect width="100" height="100" fill="black" />
            <circle cx="70" cy="50" r="45" fill="white" />
          </mask>
        );
      case "Waning Crescent":
        return (
          <mask id="moon-mask">
            <rect width="100" height="100" fill="black" />
            <circle cx="30" cy="50" r="45" fill="white" />
          </mask>
        );
      case "Waxing Gibbous":
        return (
          <mask id="moon-mask">
            <rect width="100" height="100" fill="white" />
            <circle cx="30" cy="50" r="45" fill="black" />
          </mask>
        );
      case "Waning Gibbous":
        return (
          <mask id="moon-mask">
            <rect width="100" height="100" fill="white" />
            <circle cx="70" cy="50" r="45" fill="black" />
          </mask>
        );
      default:
        return null;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      {/* Base moon */}
      <circle cx="50" cy="50" r="45" fill={color} />

      {/* Phase-specific mask */}
      {getMask()}

      {/* Shadow overlay (masked) */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill={shadowColor}
        mask="url(#moon-mask)"
      />

      {/* Optional craters (same as your example) */}
      {/* {phase !== "new" && ( */}
      <>
        <circle cx="35" cy="30" r="10" fill="#5D3FD3" opacity="0.1" />
        <circle cx="65" cy="40" r="7" fill="#5D3FD3" opacity="0.1" />
        <circle cx="40" cy="50" r="5" fill="#5D3FD3" opacity="0.1" />
      </>
      {/* )} */}
    </svg>
  );
};
