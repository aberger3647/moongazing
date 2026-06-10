import { describe, expect, it } from "vitest";
import { determineMoonPhase } from "./determineMoonPhase";

describe("determineMoonPhase", () => {
  it.each([
    [0, "New Moon"],
    [1, "New Moon"],
    [0.25, "First Quarter"],
    [0.5, "Full Moon"],
    [0.75, "Last Quarter"],
  ] as const)("maps boundary value %s -> %s", (value, expected) => {
    expect(determineMoonPhase(value)).toBe(expected);
  });

  it.each([
    [0.0001, "Waxing Crescent"],
    [0.1, "Waxing Crescent"],
    [0.249, "Waxing Crescent"],
    [0.251, "Waxing Gibbous"],
    [0.4, "Waxing Gibbous"],
    [0.499, "Waxing Gibbous"],
    [0.501, "Waning Gibbous"],
    [0.6, "Waning Gibbous"],
    [0.749, "Waning Gibbous"],
    [0.751, "Waning Crescent"],
    [0.9, "Waning Crescent"],
    [0.9999, "Waning Crescent"],
  ] as const)("maps interior value %s -> %s", (value, expected) => {
    expect(determineMoonPhase(value)).toBe(expected);
  });

  it.each([-0.001, 1.001, -1, 2, Number.NaN, Number.POSITIVE_INFINITY])(
    "throws RangeError for invalid input %s",
    (value) => {
      expect(() => determineMoonPhase(value)).toThrow(RangeError);
    },
  );
});
