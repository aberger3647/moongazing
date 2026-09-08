import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Conditions } from "./Conditions";
import { makeVisualCrossing } from "../test/fixtures";
import type { VisualCrossingDay } from "../types/visualcrossing";

const forecastDay = (
  datetime: string,
  conditions: string,
  moonphase: number,
  cloudcover: number,
  precipprob: number,
  visibility: number,
  sunset: string,
): VisualCrossingDay => ({
  datetime,
  conditions,
  moonphase,
  cloudcover,
  precipprob,
  visibility,
  sunset,
});

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
      days: [
        {
          datetime: "2026-06-10",
          conditions: "Cloudy",
          moonphase: 0.5,
          cloudcover: 100,
          precipprob: 8,
          visibility: 16,
          sunset: "20:30:00",
        },
      ],
    });

    render(<Conditions data={data} />);

    expect(screen.getByText("Clear with a chance of bats.")).toBeInTheDocument();
    expect(
      screen.getByText("No clear full or new moon night is forecast in the next 7 days."),
    ).toBeInTheDocument();

    expect(screen.getByText("Cloud cover")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("Precipitation")).toBeInTheDocument();
    expect(screen.getByText("8%")).toBeInTheDocument();
    // toMiles(16, "km") -> Math.floor(16 * 0.621371) = 9
    expect(screen.getByText("Visibility")).toBeInTheDocument();
    expect(screen.getByText("9 miles")).toBeInTheDocument();
    expect(screen.getByText("Sunset")).toBeInTheDocument();
  });

  it("summarizes moon opportunities and switches between current and seven-day conditions", async () => {
    const user = userEvent.setup();
    const data = makeVisualCrossing({
      days: [
        forecastDay("2026-06-10", "Clear", 0.5, 5, 0, 16, "20:30:00"),
        forecastDay("2026-06-11", "Clear", 0, 10, 1, 15, "20:31:00"),
        forecastDay("2026-06-12", "Rain", 0.1, 90, 80, 8, "20:32:00"),
        forecastDay("2026-06-13", "Partially cloudy", 0.2, 45, 20, 14, "20:33:00"),
        forecastDay("2026-06-14", "Clear", 0.3, 4, 0, 18, "20:34:00"),
        forecastDay("2026-06-15", "Clear", 0.7, 3, 0, 19, "20:35:00"),
        forecastDay("2026-06-16", "Overcast", 0.8, 100, 30, 7, "20:36:00"),
        forecastDay("2026-06-17", "Clear", 0.5, 0, 0, 20, "20:37:00"),
      ],
    });

    render(<Conditions data={data} />);

    expect(
      screen.getByText(/Clear skies are forecast for the full moon on June 10, 2026/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Clear skies are forecast for the new moon on June 11, 2026/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Conditions view" })).toBeInTheDocument();
    const currentButton = screen.getByRole("button", { name: "Current" });
    expect(currentButton).toHaveAttribute("aria-pressed", "true");
    expect(currentButton).toHaveClass("btn-primary");
    expect(screen.getByText("5%")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "7-day forecast" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "7-day forecast" }));

    const forecastButton = screen.getByRole("button", { name: "7-day forecast" });
    expect(forecastButton).toHaveAttribute("aria-pressed", "true");
    expect(forecastButton).toHaveClass("btn-primary");
    const forecast = screen.getByRole("list", { name: "7-day forecast" });
    expect(within(forecast).getAllByRole("listitem")).toHaveLength(7);
    expect(within(forecast).getByText("June 16, 2026")).toBeInTheDocument();
    expect(within(forecast).queryByText("June 17, 2026")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Current" }));

    expect(screen.getByRole("button", { name: "Current" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("list", { name: "7-day forecast" })).not.toBeInTheDocument();
    expect(screen.getByText("5%")).toBeInTheDocument();
  });
});
