import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { triggerMoonAlertCheck } from "./triggerMoonAlertCheck";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  mockFetch.mockReset();
});

describe("triggerMoonAlertCheck", () => {
  it("POSTs the token to the send-moon-alerts endpoint with the anon key", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true } as unknown as Response);

    await triggerMoonAlertCheck("tok-xyz");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(String(url)).toContain("/functions/v1/send-moon-alerts");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    // Kong requires the apikey header even though the function is verify_jwt=false.
    expect(init.headers.apikey).toBe("test-anon-key");
    expect(init.headers.Authorization).toBe("Bearer test-anon-key");
    expect(JSON.parse(init.body)).toEqual({ token: "tok-xyz" });
  });

  it("does nothing when no token is provided", async () => {
    await triggerMoonAlertCheck("");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("swallows network errors so signup is never disrupted", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"));
    await expect(triggerMoonAlertCheck("tok-xyz")).resolves.toBeUndefined();
  });
});
