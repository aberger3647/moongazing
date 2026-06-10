import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./emailService";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  mockFetch.mockReset();
});

const okResponse = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

const errResponse = (body: unknown, status = 500) =>
  ({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

describe("sendEmail", () => {
  it("returns success and POSTs the payload to the send-email endpoint", async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ success: true }));

    const result = await sendEmail({
      to: "person@example.com",
      subject: "hi",
      html: "<p>hi</p>",
      text: "hi",
    });

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(String(url)).toContain("/functions/v1/send-email");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      to: "person@example.com",
      subject: "hi",
      html: "<p>hi</p>",
      text: "hi",
    });
  });

  it("returns the server-reported error when the response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(
      errResponse({ success: false, error: "domain not verified" }, 500),
    );

    const result = await sendEmail({ to: "x@y.com", subject: "s" });

    expect(result).toEqual({
      success: false,
      error: "domain not verified",
    });
  });

  it("falls back to a generic error when the server omits one", async () => {
    mockFetch.mockResolvedValueOnce(errResponse({}, 500));

    const result = await sendEmail({ to: "x@y.com", subject: "s" });

    expect(result).toEqual({
      success: false,
      error: "Failed to send email",
    });
  });

  it("returns a generic message when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"));

    const result = await sendEmail({ to: "x@y.com", subject: "s" });

    expect(result).toEqual({
      success: false,
      error: "Unexpected error occurred",
    });
  });
});
