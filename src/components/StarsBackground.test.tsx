import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StarsBackground } from "./StarsBackground";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

const stubGyroSupport = () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  vi.stubGlobal("DeviceOrientationEvent", class extends Event {});
};

describe("StarsBackground", () => {
  it("renders three parallax depth layers", () => {
    const { container } = render(<StarsBackground />);
    expect(container.querySelectorAll(".parallax-layer")).toHaveLength(3);
  });

  it("nests a pointer-parallax wrapper inside each layer", () => {
    const { container } = render(<StarsBackground />);
    expect(container.querySelectorAll(".layer-pointer")).toHaveLength(3);
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

  it("keeps the tilt control available after eleven seconds", () => {
    vi.useFakeTimers();
    stubGyroSupport();

    render(<StarsBackground />);

    act(() => vi.advanceTimersByTime(11_500));

    expect(screen.getByRole("button", { name: /tilt/i })).toBeInTheDocument();
  });

  it("shows tilt as an icon-only easter egg", () => {
    stubGyroSupport();

    render(<StarsBackground />);

    expect(screen.getByRole("button", { name: "Tilt sky" })).toBeInTheDocument();
    expect(screen.queryByText("Tilt to look around")).not.toBeInTheDocument();
  });

  it("keeps the tilt control available after tilt is enabled", async () => {
    const user = userEvent.setup();
    stubGyroSupport();

    render(<StarsBackground />);

    await user.click(screen.getByRole("button", { name: /tilt/i }));

    expect(screen.getByRole("button", { name: /tilt/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
