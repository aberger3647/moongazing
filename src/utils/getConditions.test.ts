import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConditions } from "./getConditions";

const mockFetch = vi.fn();

const response = ({
  ok = true,
  status = 200,
  text,
}: {
  ok?: boolean;
  status?: number;
  text: string;
}) =>
  ({
    ok,
    status,
    text: () => Promise.resolve(text),
  }) as unknown as Response;

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  mockFetch.mockReset();
});

describe("getConditions", () => {
  it("rejects when location is empty", async () => {
    await expect(getConditions({ location: "" })).rejects.toThrow(
      "Location is required",
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns parsed JSON on a successful response", async () => {
    mockFetch.mockResolvedValueOnce(
      response({ text: JSON.stringify({ resolvedAddress: "Austin" }) }),
    );

    const result = await getConditions({ location: "Austin, TX" });

    expect(result).toEqual({ resolvedAddress: "Austin" });
    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      location: "Austin, TX",
      unitGroup: "us",
    });
  });

  it("propagates the API error message from a JSON 4xx body", async () => {
    mockFetch.mockResolvedValueOnce(
      response({
        ok: false,
        status: 400,
        text: JSON.stringify({ error: "bad location" }),
      }),
    );

    await expect(getConditions({ location: "?" })).rejects.toThrow(
      "bad location",
    );
  });

  it("includes the raw text in the thrown error for non-JSON errors", async () => {
    mockFetch.mockResolvedValueOnce(
      response({ ok: false, status: 500, text: "Server exploded" }),
    );

    await expect(getConditions({ location: "Austin" })).rejects.toThrow(
      /500.*Server exploded/,
    );
  });

  it("throws on an empty response body", async () => {
    mockFetch.mockResolvedValueOnce(response({ text: "" }));

    await expect(getConditions({ location: "Austin" })).rejects.toThrow(
      "Empty response",
    );
  });

  it("throws on a malformed JSON body", async () => {
    mockFetch.mockResolvedValueOnce(response({ text: "not json {" }));

    await expect(getConditions({ location: "Austin" })).rejects.toThrow(
      "Invalid JSON response",
    );
  });
});
