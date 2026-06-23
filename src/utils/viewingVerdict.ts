// Turns tonight's weather into the one answer the app exists to give: is it
// worth going outside? Honest about what it measures — sky clarity (cloud cover,
// rain chance, visibility), the limiting factor for seeing anything at all. Moon
// phase and darkness are shown separately; this is the "can you see the sky" call.

export type VerdictLevel = "good" | "fair" | "poor";

export interface Verdict {
  level: VerdictLevel;
  label: string;
  reason: string;
}

export interface VerdictInput {
  cloudcover: number; // %
  precipprob: number; // %
  visibilityMiles: number;
}

export function viewingVerdict({
  cloudcover,
  precipprob,
  visibilityMiles,
}: VerdictInput): Verdict {
  if (cloudcover >= 65 || precipprob >= 55) {
    const reason =
      precipprob >= 55
        ? "Rain is likely — best to wait for a drier night."
        : "Heavy cloud cover will hide most of the sky.";
    return { level: "poor", label: "Poor viewing", reason };
  }

  if (cloudcover <= 25 && precipprob <= 20 && visibilityMiles >= 6) {
    return {
      level: "good",
      label: "Great viewing",
      reason: "Clear skies and low cloud cover — head outside.",
    };
  }

  const reason =
    precipprob >= 30
      ? "A chance of passing showers, but gaps are likely."
      : visibilityMiles < 6
        ? "Some haze may soften the view."
        : "A few clouds may drift through.";
  return { level: "fair", label: "Fair viewing", reason };
}
