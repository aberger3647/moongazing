import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlaces } from "./usePlaces";
import { makePlace } from "../test/fixtures";

const mockFetch = vi.fn();

const okResponse = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  mockFetch.mockReset();
});

describe("usePlaces", () => {
  it("returns empty places, noPlaces=true and skips fetch when location is null", () => {
    const { result } = renderHook(() => usePlaces(null));

    expect(result.current.places).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.noPlaces).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and populates places when location is provided", async () => {
    const places = [makePlace({ id: 1 }), makePlace({ id: 2 })];
    mockFetch.mockResolvedValueOnce(okResponse({ data: places }));

    const { result } = renderHook(() =>
      usePlaces({ lat: 30, lng: -97 }, { radius: 1000, limit: 5 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.places).toEqual(places);
    expect(result.current.error).toBeNull();
    expect(result.current.noPlaces).toBe(false);

    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      lat: 30,
      lng: -97,
      radius: 1000,
      limit: 5,
    });
  });

  it("sets error and clears places when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => usePlaces({ lat: 1, lng: 2 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("boom");
    expect(result.current.places).toEqual([]);
    expect(result.current.noPlaces).toBe(true);
  });

  it("returns empty places (not error) when the API replies !ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "boom" } }),
    } as unknown as Response);

    const { result } = renderHook(() => usePlaces({ lat: 1, lng: 2 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.places).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.noPlaces).toBe(true);
  });

  it("refetches when lat/lng change", async () => {
    mockFetch.mockResolvedValue(okResponse({ data: [makePlace()] }));

    const { rerender } = renderHook(({ loc }) => usePlaces(loc), {
      initialProps: { loc: { lat: 1, lng: 2 } as { lat: number; lng: number } | null },
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    rerender({ loc: { lat: 3, lng: 4 } });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
