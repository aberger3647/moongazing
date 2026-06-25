import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reverseGeocode } from "./reverseGeocode";

const mockFetch = vi.fn();

const json = (data: unknown, ok = true) =>
  ({
    ok,
    json: () => Promise.resolve(data),
  }) as unknown as Response;

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  mockFetch.mockReset();
});

describe("reverseGeocode", () => {
  it("returns 'City, Region' when both are present", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ city: "Austin", principalSubdivision: "Texas" }),
    );
    await expect(reverseGeocode(30.2672, -97.7431)).resolves.toBe(
      "Austin, Texas",
    );
  });

  it("queries BigDataCloud with the given coordinates", async () => {
    mockFetch.mockResolvedValueOnce(json({ city: "Austin" }));
    await reverseGeocode(30.2672, -97.7431);
    const url = String(mockFetch.mock.calls[0][0]);
    expect(url).toContain("latitude=30.2672");
    expect(url).toContain("longitude=-97.7431");
  });

  it("falls back to the locality when there is no city", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ locality: "Marfa", principalSubdivision: "Texas" }),
    );
    await expect(reverseGeocode(30.31, -104.02)).resolves.toBe("Marfa, Texas");
  });

  it("omits the region when it matches the city", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ city: "Singapore", principalSubdivision: "Singapore" }),
    );
    await expect(reverseGeocode(1.29, 103.85)).resolves.toBe("Singapore");
  });

  it("returns the city alone when no region is provided", async () => {
    mockFetch.mockResolvedValueOnce(json({ city: "Reykjavík" }));
    await expect(reverseGeocode(64.14, -21.94)).resolves.toBe("Reykjavík");
  });

  it("falls back to the region when there is no populated place", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ city: "", locality: "", principalSubdivision: "Hawaii" }),
    );
    await expect(reverseGeocode(20, -160)).resolves.toBe("Hawaii");
  });

  it("returns null when nothing usable is returned", async () => {
    mockFetch.mockResolvedValueOnce(json({}));
    await expect(reverseGeocode(0, 0)).resolves.toBeNull();
  });

  it("returns null on a non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(json({}, false));
    await expect(reverseGeocode(30, -97)).resolves.toBeNull();
  });

  it("returns null when the request throws (network/timeout)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("aborted"));
    await expect(reverseGeocode(30, -97)).resolves.toBeNull();
  });
});
