import { describe, expect, it } from "vitest";
import { toMiles } from "./toMiles";

describe("toMiles", () => {
  it("converts kilometers using the 0.621371 factor and floors", () => {
    expect(toMiles(1, "km")).toBe(0);
    expect(toMiles(2, "km")).toBe(1);
    expect(toMiles(100, "km")).toBe(62);
    expect(toMiles(1000, "km")).toBe(621);
  });

  it("converts meters using the 0.000621371 factor and floors", () => {
    expect(toMiles(0, "m")).toBe(0);
    expect(toMiles(1609, "m")).toBe(0);
    expect(toMiles(1610, "m")).toBe(1);
    expect(toMiles(160934, "m")).toBe(99);
    expect(toMiles(1_000_000, "m")).toBe(621);
  });

  it("defaults unit to meters when omitted", () => {
    expect(toMiles(160934)).toBe(99);
  });

  it("throws when given an unsupported unit", () => {
    // @ts-expect-error -- intentionally invalid
    expect(() => toMiles(100, "mi")).toThrow("Invalid unit");
  });
});
