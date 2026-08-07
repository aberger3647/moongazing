import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AddToCalendar } from "./AddToCalendar";

const setUrl = (search: string) => window.history.replaceState({}, "", `/add-to-calendar${search}`);

describe("AddToCalendar", () => {
  it("shows an error and no calendar links when the date is missing", () => {
    setUrl("");
    render(<AddToCalendar />);
    expect(screen.getByText(/missing its date/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Add to Google Calendar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Download \.ics file/i })).not.toBeInTheDocument();
  });

  it("shows an error when the date is unparseable", () => {
    setUrl("?date=not-a-date");
    render(<AddToCalendar />);
    expect(screen.getByText(/missing its date/i)).toBeInTheDocument();
  });

  it("renders both calendar links for a valid full-moon link", () => {
    setUrl("?date=2026-06-13&location=austin%20tx&kind=full");
    render(<AddToCalendar />);

    const googleLink = screen.getByRole("link", { name: /Add to Google Calendar/i });
    expect(googleLink).toHaveAttribute("href", expect.stringContaining("dates=20260613/20260614"));

    const icsLink = screen.getByRole("link", { name: /Download \.ics file/i });
    expect(icsLink.getAttribute("href")).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(icsLink).toHaveAttribute("download", "moongazing-full-20260613.ics");

    expect(screen.getByText(/Moon Gazing in Austin Tx/)).toBeInTheDocument();
  });

  it("swaps in the stargazing copy for kind=new", () => {
    setUrl("?date=2026-06-13&location=austin%20tx&kind=new");
    render(<AddToCalendar />);
    expect(screen.getByText(/Stargazing in Austin Tx/)).toBeInTheDocument();
  });

  it("falls back to kind=full for an unrecognized kind value", () => {
    setUrl("?date=2026-06-13&location=austin%20tx&kind=bogus");
    render(<AddToCalendar />);
    expect(screen.getByText(/Moon Gazing in Austin Tx/)).toBeInTheDocument();
  });

  it("still renders successfully with no location", () => {
    setUrl("?date=2026-06-13");
    render(<AddToCalendar />);
    expect(screen.getByRole("link", { name: /Add to Google Calendar/i })).toBeInTheDocument();
    expect(screen.getByText(/^Moon Gazing on/)).toBeInTheDocument();
  });

  it("always shows a Return to home link", () => {
    setUrl("?date=2026-06-13");
    render(<AddToCalendar />);
    expect(screen.getByRole("link", { name: /Return to home/i })).toHaveAttribute("href", "/");
  });
});
