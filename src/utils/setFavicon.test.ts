import { afterEach, describe, expect, it } from "vitest";
import { moonSvgs } from "./moonSvgs";
import { setFavicon } from "./setFavicon";
import type { MoonPhase } from "../types/MoonPhase";

afterEach(() => {
  document.head.querySelectorAll("link[rel~='icon']").forEach((n) => n.remove());
});

describe("setFavicon", () => {
  it("appends a new <link rel='icon'> when none exists", () => {
    expect(document.head.querySelector("link[rel~='icon']")).toBeNull();

    setFavicon("Full Moon");

    const link = document.head.querySelector<HTMLLinkElement>(
      "link[rel~='icon']",
    );
    expect(link).not.toBeNull();
    expect(link!.type).toBe("image/svg+xml");
    expect(link!.href).toContain(moonSvgs["Full Moon"]);
  });

  it("updates the existing favicon's href instead of duplicating", () => {
    setFavicon("New Moon");
    setFavicon("Waxing Crescent");

    const links = document.head.querySelectorAll("link[rel~='icon']");
    expect(links).toHaveLength(1);
    expect((links[0] as HTMLLinkElement).href).toContain(
      moonSvgs["Waxing Crescent"],
    );
  });

  it("covers every MoonPhase key", () => {
    const phases: MoonPhase[] = [
      "New Moon",
      "Waxing Crescent",
      "First Quarter",
      "Waxing Gibbous",
      "Full Moon",
      "Waning Gibbous",
      "Last Quarter",
      "Waning Crescent",
    ];
    for (const phase of phases) {
      expect(moonSvgs[phase]).toMatch(/\.svg$/);
    }
  });
});
