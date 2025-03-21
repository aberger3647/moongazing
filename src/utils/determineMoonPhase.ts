export const determineMoonPhase = (moonPhaseValue: number): string => {
  if (moonPhaseValue === 0) {
    return "New Moon";
  }
  if (moonPhaseValue > 0 && moonPhaseValue < 0.25) {
    return "Waxing Crescent";
  }
  if (moonPhaseValue === 0.25) {
    return "First Quarter";
  }
  if (moonPhaseValue > 0.25 && moonPhaseValue < 0.5) {
    return "Waxing Gibbous";
  }
  if (moonPhaseValue === 0.5) {
    return "Full Moon";
  }
  if (moonPhaseValue > 0.5 && moonPhaseValue < 0.75) {
    return "Waning Gibbous";
  }
  if (moonPhaseValue === 0.75) {
    return "Third Quarter";
  }
  if (moonPhaseValue > 0.75 && moonPhaseValue < 1) {
    return "Waning Crescent";
  }
  return "Unknown";
};
