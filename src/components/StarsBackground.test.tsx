import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { StarsBackground } from "./StarsBackground";

describe("StarsBackground", () => {
  it("renders three parallax depth layers", () => {
    const { container } = render(<StarsBackground />);
    expect(container.querySelectorAll(".parallax-layer")).toHaveLength(3);
  });

  it("renders the full star field (42 + 27 + 14 + 5 bright = 88)", () => {
    const { container } = render(<StarsBackground />);
    expect(container.querySelectorAll(".star-twinkle")).toHaveLength(88);
  });

  it("gives the brightest stars diffraction spikes", () => {
    const { container } = render(<StarsBackground />);
    expect(container.querySelectorAll(".star-bright")).toHaveLength(5);
  });

  it("does not block clicks (pointer-events-none on the layer root)", () => {
    const { container } = render(<StarsBackground />);
    expect(container.firstElementChild).toHaveClass("pointer-events-none");
  });
});
