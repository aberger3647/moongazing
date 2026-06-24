import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Conditions } from "./Conditions";
import { makeVisualCrossing } from "../test/fixtures";

describe("Conditions", () => {
  it("renders the description and every metric with its value", () => {
    const data = makeVisualCrossing({
      description: "Clear with a chance of bats.",
      currentConditions: {
        sunset: "20:30:00",
        visibility: 16,
        cloudcover: 12,
        precipprob: 8,
      },
    });

    render(<Conditions data={data} />);

    expect(screen.getByText("Clear with a chance of bats.")).toBeInTheDocument();

    expect(screen.getByText("Cloud cover")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("Precipitation")).toBeInTheDocument();
    expect(screen.getByText("8%")).toBeInTheDocument();
    // toMiles(16, "km") -> Math.floor(16 * 0.621371) = 9
    expect(screen.getByText("Visibility")).toBeInTheDocument();
    expect(screen.getByText("9 miles")).toBeInTheDocument();
    expect(screen.getByText("Sunset")).toBeInTheDocument();
  });
});
