import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Hoist mock state so vi.mock factories (also hoisted) can reach it.
const { mocks } = vi.hoisted(() => ({
  mocks: {
    singleResults: [] as Array<{ data: unknown; error: unknown }>,
    fromCalls: [] as string[],
    sendEmail: vi.fn(),
    triggerMoonAlertCheck: vi.fn(),
  },
}));

vi.mock("../supabaseClient", () => {
  // A fluent chain where every builder method returns `this` and only
  // `.single()` consumes a queued result. This matches Alerts.tsx's usage.
  const builder: any = {};
  for (const method of ["select", "insert", "upsert", "update", "eq", "delete"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => {
    const next = mocks.singleResults.shift();
    if (!next) {
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve(next);
  });
  return {
    supabase: {
      from: vi.fn((table: string) => {
        mocks.fromCalls.push(table);
        return builder;
      }),
    },
  };
});

vi.mock("../utils", async () => {
  const actual = await vi.importActual<typeof import("../utils")>("../utils");
  return {
    ...actual,
    sendEmail: mocks.sendEmail,
    triggerMoonAlertCheck: mocks.triggerMoonAlertCheck,
  };
});

import { Alerts } from "./Alerts";

beforeEach(() => {
  mocks.singleResults = [];
  mocks.fromCalls = [];
  mocks.sendEmail.mockReset();
  mocks.sendEmail.mockResolvedValue({ success: true });
  mocks.triggerMoonAlertCheck.mockReset();
  mocks.triggerMoonAlertCheck.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

const fillAndSubmit = async (email = "person@example.com") => {
  await userEvent.type(screen.getByPlaceholderText(/hello@email/i), email);
  await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));
};

describe("Alerts", () => {
  it("does not submit when lat/lng are missing", async () => {
    render(<Alerts location="Austin, TX" />);
    await fillAndSubmit();
    expect(mocks.fromCalls).toEqual([]);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("creates user + location + alert and sends a confirmation email on the happy path", async () => {
    mocks.singleResults = [
      { data: null, error: null }, // users select (no existing)
      { data: { id: "user-1" }, error: null }, // users insert
      { data: { id: "loc-1" }, error: null }, // user_locations upsert
      { data: null, error: null }, // alerts select (no existing)
      { data: { unsubscribe_token: "tok-xyz" }, error: null }, // alerts upsert
    ];

    render(<Alerts location="austin tx" lat={30.27} lng={-97.74} />);
    await fillAndSubmit("hi@example.com");

    await waitFor(() =>
      expect(
        screen.getByText(/Subscription confirmed/i),
      ).toBeInTheDocument(),
    );

    expect(mocks.fromCalls).toEqual([
      "users",
      "users",
      "user_locations",
      "alerts",
      "alerts",
    ]);
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    const arg = mocks.sendEmail.mock.calls[0][0];
    expect(arg.to).toBe("hi@example.com");
    expect(arg.subject).toContain("Austin Tx");
    expect(arg.html).toContain("tok-xyz");

    // A fresh signup triggers an immediate moon-alert check for this alert so
    // the user isn't left waiting for the next daily cron run.
    expect(mocks.triggerMoonAlertCheck).toHaveBeenCalledWith("tok-xyz");
  });

  it("short-circuits with a friendly message when an alert already exists", async () => {
    mocks.singleResults = [
      { data: { id: "user-1" }, error: null }, // users select (existing)
      { data: { id: "loc-1" }, error: null }, // user_locations upsert
      { data: { id: "alert-1" }, error: null }, // alerts select (existing!)
    ];

    render(<Alerts location="austin tx" lat={30.27} lng={-97.74} />);
    await fillAndSubmit("hi@example.com");

    await waitFor(() =>
      expect(
        screen.getByText(/already subscribed/i),
      ).toBeInTheDocument(),
    );

    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.triggerMoonAlertCheck).not.toHaveBeenCalled();
  });

  it("surfaces an error message when a Supabase write fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.singleResults = [
      { data: null, error: null },
      { data: null, error: { message: "insert failed" } },
    ];

    render(<Alerts location="austin tx" lat={30.27} lng={-97.74} />);
    await fillAndSubmit("hi@example.com");

    await waitFor(() =>
      expect(screen.getByText(/Error subscribing/i)).toBeInTheDocument(),
    );
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.triggerMoonAlertCheck).not.toHaveBeenCalled();
  });
});
