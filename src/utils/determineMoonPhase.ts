import type { MoonPhase } from "../types/MoonPhase";

// Visual Crossing reports moonphase as a number in [0, 1] where 0 and 1 are both
// the new moon (start vs. end of the lunar cycle) and 0.5 is the full moon.
export const determineMoonPhase = (value: number): MoonPhase => {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(
      `determineMoonPhase: value must be a finite number in [0, 1], got ${value}`,
    );
  }
  if (value === 0 || value === 1) return "New Moon";
  if (value < 0.25) return "Waxing Crescent";
  if (value === 0.25) return "First Quarter";
  if (value < 0.5) return "Waxing Gibbous";
  if (value === 0.5) return "Full Moon";
  if (value < 0.75) return "Waning Gibbous";
  if (value === 0.75) return "Last Quarter";
  return "Waning Crescent";
};
