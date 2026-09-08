import type { VisualCrossingDay } from "../types/visualcrossing";
import { formatTime } from "./formatTime";
import { toMiles } from "./toMiles";

export interface ForecastDay {
  date: string;
  condition: string;
  cloudCover: number;
  precipitationChance: number;
  visibilityMiles: number;
  sunset: string;
}

export type MoonOpportunity =
  | { kind: "full"; day: ForecastDay }
  | { kind: "new"; day: ForecastDay };

export interface SevenDayForecast {
  days: ForecastDay[];
  opportunities: MoonOpportunity[];
}

const PHASE_TOLERANCE = 0.05;

const formatDate = (datetime: string): string =>
  new Date(`${datetime}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export function buildSevenDayForecast(days: readonly VisualCrossingDay[]): SevenDayForecast {
  const candidates = days.slice(0, 7).map((source) => ({
    source,
    day: {
      date: formatDate(source.datetime),
      condition: source.conditions,
      cloudCover: source.cloudcover,
      precipitationChance: source.precipprob,
      visibilityMiles: toMiles(source.visibility, "km"),
      sunset: formatTime(source.sunset),
    },
  }));

  const closest = (
    kind: MoonOpportunity["kind"],
    distanceFromTarget: (phase: number) => number,
  ): MoonOpportunity | null => {
    let best: { day: ForecastDay; distance: number } | null = null;

    for (const candidate of candidates) {
      if (!candidate.source.conditions.includes("Clear")) continue;
      const distance = distanceFromTarget(candidate.source.moonphase);
      if (distance > PHASE_TOLERANCE + Number.EPSILON) continue;
      if (best === null || distance < best.distance) {
        best = { day: candidate.day, distance };
      }
    }

    if (best === null) return null;
    return kind === "full"
      ? { kind: "full", day: best.day }
      : { kind: "new", day: best.day };
  };

  const opportunities: MoonOpportunity[] = [];
  const full = closest("full", (phase) => Math.abs(phase - 0.5));
  const newMoon = closest("new", (phase) =>
    Math.min(Math.abs(phase), Math.abs(1 - phase)),
  );
  if (full) opportunities.push(full);
  if (newMoon) opportunities.push(newMoon);

  return { days: candidates.map(({ day }) => day), opportunities };
}
