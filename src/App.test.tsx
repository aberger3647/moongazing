import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the weather utils so we control cloud cover per search.
vi.mock("./utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./utils")>();
  return {
    ...actual,
    getMoonPhase: vi.fn().mockResolvedValue(0.5),
    getConditions: vi.fn(),
  };
});

import App from "./App";
import { getConditions } from "./utils";
import { makeVisualCrossing } from "./test/fixtures";

const mockedGetConditions = vi.mocked(getConditions);
const cloudNodes = (c: HTMLElement) => c.querySelectorAll(".cloud-drift").length;

const conditionsFor = (resolvedAddress: string, cloudcover: number) =>
  makeVisualCrossing({
    resolvedAddress,
    currentConditions: { sunset: "20:30:00", visibility: 16, cloudcover, precipprob: 0, moonphase: 0.5 },
  });

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  mockedGetConditions.mockReset();
});

describe("App background reacts to location changes", () => {
  it("updates cloud density when a new location has different cloud cover", async () => {
    const { container } = render(<App />);
    const input = screen.getByPlaceholderText("City");
    const submit = screen.getByRole("button", { name: /submit/i });

    // First location: heavy cloud cover -> round(90/100 * 8) = 7 puffs.
    mockedGetConditions.mockResolvedValueOnce(conditionsFor("Seattle, WA", 90));
    await userEvent.type(input, "Seattle");
    await userEvent.click(submit);
    await waitFor(() => expect(cloudNodes(container)).toBe(7));

    // Change location: light cloud cover -> round(10/100 * 8) = 1 puff.
    mockedGetConditions.mockResolvedValueOnce(conditionsFor("Phoenix, AZ", 10));
    await userEvent.clear(input);
    await userEvent.type(input, "Phoenix");
    await userEvent.click(submit);
    await waitFor(() => expect(cloudNodes(container)).toBe(1));
  });

  it("clears clouds when a new location is completely clear", async () => {
    const { container } = render(<App />);
    const input = screen.getByPlaceholderText("City");
    const submit = screen.getByRole("button", { name: /submit/i });

    mockedGetConditions.mockResolvedValueOnce(conditionsFor("London, UK", 100));
    await userEvent.type(input, "London");
    await userEvent.click(submit);
    await waitFor(() => expect(cloudNodes(container)).toBe(8));

    mockedGetConditions.mockResolvedValueOnce(conditionsFor("Atacama, CL", 0));
    await userEvent.clear(input);
    await userEvent.type(input, "Atacama");
    await userEvent.click(submit);
    await waitFor(() => expect(cloudNodes(container)).toBe(0));
  });
});
