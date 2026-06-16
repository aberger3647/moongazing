import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { CloudsBackground } from "./CloudsBackground";

const cloudCount = (container: HTMLElement) =>
  container.querySelectorAll(".cloud-drift").length;

describe("CloudsBackground", () => {
  it("renders nothing for clear sky (null cloud cover)", () => {
    const { container } = render(<CloudsBackground cloudcover={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing at 0% cloud cover", () => {
    const { container } = render(<CloudsBackground cloudcover={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("scales the number of clouds with cloud cover (MAX_CLOUDS = 8)", () => {
    // count = max(1, round(cc / 100 * 8))
    expect(cloudCount(render(<CloudsBackground cloudcover={5} />).container)).toBe(1); // round(0.4) -> floor to min 1
    expect(cloudCount(render(<CloudsBackground cloudcover={50} />).container)).toBe(4);
    expect(cloudCount(render(<CloudsBackground cloudcover={80} />).container)).toBe(6);
    expect(cloudCount(render(<CloudsBackground cloudcover={100} />).container)).toBe(8);
  });

  it("builds each cloud from several overlapping lobes", () => {
    const { container } = render(<CloudsBackground cloudcover={100} />);
    const firstCloud = container.querySelector(".cloud-drift");
    // Multi-lobe clouds read as cloud, not a single blob.
    expect(firstCloud?.querySelectorAll("span").length ?? 0).toBeGreaterThan(1);
  });

  it("does not block clicks (pointer-events-none on the layer root)", () => {
    const { container } = render(<CloudsBackground cloudcover={80} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("pointer-events-none");
  });
});
