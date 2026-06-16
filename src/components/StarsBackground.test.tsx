import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { StarsBackground } from "./StarsBackground";

describe("StarsBackground", () => {
  it("renders three parallax depth layers with 120 twinkling stars", () => {
    const { container } = render(<StarsBackground />);
    expect(container.querySelectorAll(".parallax-layer")).toHaveLength(3);
    expect(container.querySelectorAll(".star-twinkle")).toHaveLength(120); // 50 + 40 + 30
  });

  it("does not block clicks (pointer-events-none on the layer root)", () => {
    const { container } = render(<StarsBackground />);
    expect(container.firstElementChild).toHaveClass("pointer-events-none");
  });
});
