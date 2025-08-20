import type { MoonPhase } from "../types/MoonPhase";

export const determineMoonPhase = (value: number): MoonPhase => {
  if (value === 0) {
    return "New Moon";
  }
  if (value > 0 && value < 0.25) {
    return "Waxing Crescent";
  }
  if (value === 0.25) {
    return "First Quarter";
  }
  if (value > 0.25 && value < 0.5) {
    return "Waxing Gibbous";
  }
  if (value === 0.5) {
    return "Full Moon";
  }
  if (value > 0.5 && value < 0.75) {
    return "Waning Gibbous";
  }
  if (value > 0.75 && value < 1) {
    return "Waning Crescent";
  }
  return "Full Moon";
};
