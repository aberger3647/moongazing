import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MoonDisc, moonLitPath } from "./MoonDisc";

// The terminator geometry is the load-bearing, error-prone part — test it directly.
// The limb arc is `A 63.7 63.7 0 0 <sweep>` where sweep 1 = right (waxing) and
// 0 = left (waning); the terminator arc's first radius is |R·cos| (≈0 at the quarters),
// so "A 63.7 63.7 0 0 1" uniquely identifies a right-lit limb.
describe("moonLitPath (terminator geometry)", () => {
  it("draws no illuminated region at new moon", () => {
    expect(moonLitPath(0)).toBeNull();
    expect(moonLitPath(1)).toBeNull(); // a full cycle later is new again
  });

  it("returns a path for a full moon", () => {
    expect(typeof moonLitPath(0.5)).toBe("string");
  });

  it("lights the right limb when waxing (first quarter)", () => {
    expect(moonLitPath(0.25)).toContain("A 63.7 63.7 0 0 1");
  });

  it("lights the left limb when waning (last quarter)", () => {
    expect(moonLitPath(0.75)).toContain("A 63.7 63.7 0 0 0");
  });

  it("puts waxing and waning crescents on opposite limbs", () => {
    expect(moonLitPath(0.15)).toContain("A 63.7 63.7 0 0 1"); // waxing → right
    expect(moonLitPath(0.85)).toContain("A 63.7 63.7 0 0 0"); // waning → left
  });
});

describe("MoonDisc", () => {
  it("renders only the shadowed disc at new moon (no lit region)", () => {
    const { container } = render(<MoonDisc phase={0} />);
    expect(container.querySelector('circle[fill="#3e31a4"]')).toBeTruthy();
    expect(container.querySelector('path[fill="#ffe8a6"]')).toBeNull();
  });

  it("paints an illuminated region for a full moon", () => {
    const { container } = render(<MoonDisc phase={0.5} />);
    expect(container.querySelector('path[fill="#ffe8a6"]')).toBeTruthy();
  });

  it("is decorative (aria-hidden) and keeps any passed sizing class", () => {
    const { container } = render(<MoonDisc phase={0.5} className="h-40 w-40" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg).toHaveClass("h-40", "w-40", "moon-rise");
  });
});
