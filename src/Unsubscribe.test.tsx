import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Unsubscribe } from "./Unsubscribe";

const mockFetch = vi.fn();

const okJson = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

const errJson = (body: unknown, status = 404) =>
  ({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  mockFetch.mockReset();
});

describe("Unsubscribe", () => {
  it("shows an error immediately when no token is in the URL", async () => {
    render(<Unsubscribe />);
    await waitFor(() =>
      expect(
        screen.getByText(/No unsubscribe token provided/i),
      ).toBeInTheDocument(),
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("renders success when the API returns ok", async () => {
    window.history.replaceState({}, "", "/unsubscribe?token=tok-1");
    mockFetch.mockResolvedValueOnce(okJson({ success: true }));

    render(<Unsubscribe />);

    await waitFor(() =>
      expect(
        screen.getByText(/successfully unsubscribed/i),
      ).toBeInTheDocument(),
    );
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("URL-encodes the token so '+' and '&' don't break the query string", async () => {
    window.history.replaceState({}, "", "/unsubscribe?token=tok%2Bspecial%26x");
    mockFetch.mockResolvedValueOnce(okJson({ success: true }));

    render(<Unsubscribe />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());
    const url = String(mockFetch.mock.calls[0][0]);
    expect(url).toContain("token=tok%2Bspecial%26x");
    expect(url).not.toContain("tok+special&x");
  });

  it("renders the server-supplied error when the API returns !ok", async () => {
    window.history.replaceState({}, "", "/unsubscribe?token=bad");
    mockFetch.mockResolvedValueOnce(errJson({ error: "expired" }));

    render(<Unsubscribe />);

    await waitFor(() =>
      expect(screen.getByText(/expired/i)).toBeInTheDocument(),
    );
  });

  it("renders a generic error when fetch throws", async () => {
    window.history.replaceState({}, "", "/unsubscribe?token=tok");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockRejectedValueOnce(new Error("offline"));

    render(<Unsubscribe />);

    await waitFor(() =>
      expect(screen.getByText(/An error occurred/i)).toBeInTheDocument(),
    );
  });
});
