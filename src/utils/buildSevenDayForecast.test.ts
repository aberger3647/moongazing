import { describe, expect, it } from "vitest";

import type { VisualCrossingDay } from "../types/visualcrossing";
import { buildSevenDayForecast } from "./index";

const day = (
  datetime: string,
  moonphase: number,
  conditions = "Clear",
): VisualCrossingDay => ({
  datetime,
  moonphase,
  conditions,
  cloudcover: 12,
  precipprob: 8,
  visibility: 16,
  sunset: "20:30:00",
});

describe("buildSevenDayForecast", () => {
  it("returns independent clear full and new moon opportunities", () => {
    const result = buildSevenDayForecast([
      day("2026-06-10", 0.5),
      day("2026-06-11", 0),
    ]);

    expect(result.opportunities).toEqual([
      { kind: "full", day: result.days[0] },
      { kind: "new", day: result.days[1] },
    ]);
  });

  it("recognizes phase 1 as a new moon boundary", () => {
    const result = buildSevenDayForecast([day("2026-06-10", 1)]);

    expect(result.opportunities).toEqual([{ kind: "new", day: result.days[0] }]);
  });

  it("limits display and opportunity detection to seven days and rejects cloudy exact phases", () => {
    const result = buildSevenDayForecast([
      day("2026-06-10", 0.5, "Cloudy"),
      day("2026-06-11", 0, "Cloudy"),
      day("2026-06-12", 0.2),
      day("2026-06-13", 0.3),
      day("2026-06-14", 0.4),
      day("2026-06-15", 0.6),
      day("2026-06-16", 0.7),
      day("2026-06-17", 0.5),
    ]);

    expect(result.days).toHaveLength(7);
    expect(result.days.at(-1)?.date).toBe("June 16, 2026");
    expect(result.opportunities).toEqual([]);
  });
});
