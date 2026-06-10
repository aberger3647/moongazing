import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManageAlerts } from "./ManageAlerts";
import { makeAlert } from "./test/fixtures";

const mockFetch = vi.fn();

const okJson = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

const errJson = (body: unknown, status = 400) =>
  ({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  window.history.replaceState({}, "", "/manage-alerts?token=tok-1");
});

afterEach(() => {
  mockFetch.mockReset();
});

describe("ManageAlerts", () => {
  it("shows an error when no token is in the URL", async () => {
    window.history.replaceState({}, "", "/manage-alerts");
    render(<ManageAlerts />);
    await waitFor(() =>
      expect(
        screen.getByText(/No management token provided/i),
      ).toBeInTheDocument(),
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("renders the empty state when the API returns no alerts", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ alerts: [] }));

    render(<ManageAlerts />);

    await waitFor(() =>
      expect(
        screen.getByText(/don't have any active alerts/i),
      ).toBeInTheDocument(),
    );
  });

  it("renders one row per alert with title-cased location names", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        alerts: [
          makeAlert({ id: "a", location_name: "austin tx", unsubscribe_token: "ta" }),
          makeAlert({ id: "b", location_name: "boulder co", unsubscribe_token: "tb" }),
        ],
      }),
    );

    render(<ManageAlerts />);

    await waitFor(() => {
      expect(screen.getByText("Austin Tx")).toBeInTheDocument();
      expect(screen.getByText("Boulder Co")).toBeInTheDocument();
    });
  });

  it("removes a single alert row after a successful unsubscribe", async () => {
    mockFetch
      .mockResolvedValueOnce(
        okJson({
          alerts: [
            makeAlert({ id: "a", location_name: "austin tx" }),
            makeAlert({ id: "b", location_name: "boulder co" }),
          ],
        }),
      )
      .mockResolvedValueOnce(okJson({ success: true }));

    render(<ManageAlerts />);

    const austinRow = await screen.findByText("Austin Tx");
    const unsubButton = austinRow.parentElement!.parentElement!.querySelector(
      "button",
    )!;
    await userEvent.click(unsubButton);

    await waitFor(() =>
      expect(screen.queryByText("Austin Tx")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Boulder Co")).toBeInTheDocument();
  });

  it("clears the list after 'Unsubscribe from All' succeeds", async () => {
    mockFetch
      .mockResolvedValueOnce(
        okJson({
          alerts: [
            makeAlert({ id: "a", location_name: "austin tx" }),
            makeAlert({ id: "b", location_name: "boulder co" }),
          ],
        }),
      )
      .mockResolvedValueOnce(okJson({ success: true, count: 2 }));

    render(<ManageAlerts />);

    await screen.findByText("Austin Tx");

    await userEvent.click(
      screen.getByRole("button", { name: /unsubscribe from all/i }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(/unsubscribed from all alerts/i),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Austin Tx")).not.toBeInTheDocument();
    expect(screen.queryByText("Boulder Co")).not.toBeInTheDocument();
  });

  it("surfaces a server error from the alerts fetch", async () => {
    mockFetch.mockResolvedValueOnce(errJson({ error: "invalid token" }, 404));

    render(<ManageAlerts />);

    await waitFor(() =>
      expect(screen.getByText(/invalid token/i)).toBeInTheDocument(),
    );
  });

  it("URL-encodes the management token on the alerts fetch", async () => {
    window.history.replaceState({}, "", "/manage-alerts?token=tok%2Bplus");
    mockFetch.mockResolvedValueOnce(okJson({ alerts: [] }));

    render(<ManageAlerts />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const url = String(mockFetch.mock.calls[0][0]);
    expect(url).toContain("token=tok%2Bplus");
  });
});
