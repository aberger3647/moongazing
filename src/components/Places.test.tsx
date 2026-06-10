import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Places } from "./Places";
import { makePlace } from "../test/fixtures";

describe("Places", () => {
  it("shows a loading message while loading", () => {
    render(
      <Places
        location="Austin, TX"
        places={[]}
        radius={160934}
        setRadius={() => {}}
        loading
      />,
    );

    expect(screen.getByText(/Loading places/i)).toBeInTheDocument();
  });

  it("shows the empty state when no places are returned", () => {
    render(
      <Places
        location="Austin, TX"
        places={[]}
        radius={160934}
        setRadius={() => {}}
      />,
    );

    expect(
      screen.getByText(/No places found within this radius/i),
    ).toBeInTheDocument();
  });

  it("renders each place with name, category, and converted distance", () => {
    const places = [
      makePlace({ id: 1, place_name: "Big Bend", category: "Park", distance: 50000 }),
      makePlace({ id: 2, place_name: "Enchanted Rock", category: "Park", distance: 100000 }),
    ];

    render(
      <Places
        location="Austin, TX"
        places={places}
        radius={482803}
        setRadius={() => {}}
      />,
    );

    expect(screen.getByText("Big Bend")).toBeInTheDocument();
    expect(screen.getByText("Enchanted Rock")).toBeInTheDocument();
    // toMiles(50000, "m") -> 31 miles; toMiles(100000, "m") -> 62 miles
    expect(screen.getByText(/31 miles away/)).toBeInTheDocument();
    expect(screen.getByText(/62 miles away/)).toBeInTheDocument();
  });

  it("calls setRadius with the numeric value when the user changes the dropdown", async () => {
    const setRadius = vi.fn();
    render(
      <Places
        location="Austin, TX"
        places={[]}
        radius={160934}
        setRadius={setRadius}
      />,
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox"),
      "482803",
    );

    expect(setRadius).toHaveBeenCalledWith(482803);
  });

  it("renders 'Distance unknown' when distance is missing", () => {
    render(
      <Places
        location="Austin, TX"
        places={[makePlace({ distance: undefined })]}
        radius={160934}
        setRadius={() => {}}
      />,
    );

    expect(screen.getByText(/Distance unknown/)).toBeInTheDocument();
  });
});
