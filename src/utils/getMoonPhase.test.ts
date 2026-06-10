import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMoonPhase } from "./getMoonPhase";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  mockFetch.mockReset();
});

const okText = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as unknown as Response;

describe("getMoonPhase", () => {
  it("returns the first day's moonphase when present", async () => {
    mockFetch.mockResolvedValueOnce(
      okText({ days: [{ moonphase: 0.5 }, { moonphase: 0.6 }] }),
    );

    await expect(getMoonPhase("Austin, TX")).resolves.toBe(0.5);
  });

  it("returns null when the response lacks a numeric moonphase", async () => {
    mockFetch.mockResolvedValueOnce(okText({ days: [{}] }));

    await expect(getMoonPhase("Austin, TX")).resolves.toBeNull();
  });

  it("returns null when getConditions throws underneath", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));

    await expect(getMoonPhase("Austin, TX")).resolves.toBeNull();
  });
});
