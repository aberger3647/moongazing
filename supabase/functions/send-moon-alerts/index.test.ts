import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler } from "./handler.ts";
import {
  jsonResponse,
  makeMockSupabase,
  makeRequest,
  mockFetch,
} from "../_shared/testing.ts";

const baseAlertRow = (overrides: Record<string, unknown> = {}) => ({
  id: "a1",
  user_id: "u1",
  location_id: "l1",
  last_notified: null,
  unsubscribe_token: "tok-1",
  users: { email: "person@example.com" },
  user_locations: { lat: 30.2, lng: -97.7, location_name: "austin tx" },
  ...overrides,
});

const fixedNow = () => new Date("2026-06-10T00:00:00Z");

// Helper: assemble a working handler with the typical mocks.
function harness(opts: {
  alertRows?: any[];
  forecastDays?: unknown[];
  nearbyPlaces?: unknown[];
  rpcImpl?: (name: string, args: unknown) => any;
  alertsError?: unknown;
  updateError?: unknown;
}) {
  const sendEmail = makeFn();
  const fetched = mockFetch([
    jsonResponse({ days: opts.forecastDays ?? [] }),
  ]);
  const { client, calls } = makeMockSupabase({
    tables: {
      alerts: (ctx) => {
        // The first `from('alerts')` call is the read; subsequent ones are updates.
        const isRead = ctx.ops.some((o) => o.method === "select");
        if (isRead) {
          return opts.alertsError
            ? { data: null, error: opts.alertsError }
            : { data: opts.alertRows ?? [], error: null };
        }
        return { data: null, error: opts.updateError ?? null };
      },
    },
    rpc: opts.rpcImpl ?? (() => ({
      data: opts.nearbyPlaces ?? [],
      error: null,
    })),
  });

  const handler = createHandler({
    supabase: client as never,
    fetch: fetched.fn,
    visualCrossingKey: "vc-key",
    baseUrl: "https://moongaz.ing",
    sendEmail: sendEmail.fn,
    now: fixedNow,
  });

  return { handler, sendEmail, fetched, supabaseCalls: calls };
}

function makeFn() {
  const calls: Array<unknown[]> = [];
  const fn = (...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve(undefined);
  };
  return { fn: fn as never, calls };
}

const req = () => makeRequest("POST", "https://example.com/send-moon-alerts");

Deno.test("returns 'No alerts' when there are no active alerts", async () => {
  const { handler, sendEmail } = harness({ alertRows: [] });
  const res = await handler(req());
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "No alerts");
  assertEquals(sendEmail.calls.length, 0);
});

Deno.test("returns 500 with the error message when the alerts read fails", async () => {
  const errSpy = console.error;
  console.error = () => {};
  try {
    const { handler } = harness({ alertsError: { message: "db down" } });
    const res = await handler(req());
    assertEquals(res.status, 500);
    assertEquals((await res.json()).error, "db down");
  } finally {
    console.error = errSpy;
  }
});

Deno.test("sends an email and updates last_notified when a clear full-moon day is found", async () => {
  const { handler, sendEmail, supabaseCalls } = harness({
    alertRows: [baseAlertRow()],
    forecastDays: [
      { datetime: "2026-06-12", moonphase: 0.5, conditions: "Clear" },
    ],
    nearbyPlaces: [{ place_name: "Big Bend", category: "Park", distance: 1000 }],
  });

  const res = await handler(req());
  assertEquals(res.status, 200);
  assertEquals(sendEmail.calls.length, 1);
  const [emailArgs] = sendEmail.calls[0] as [{
    to: string;
    subject: string;
    html: string;
  }];
  assertEquals(emailArgs.to, "person@example.com");
  assert(emailArgs.subject.includes("Austin Tx"));
  assert(emailArgs.html.includes("Big Bend"));

  // The handler should also have written last_notified back. Look for an
  // alerts call that includes an update + eq("id", "a1").
  const updateCalls = supabaseCalls.from.filter((c) =>
    c.ops.some((o) => o.method === "update")
  );
  assertEquals(updateCalls.length, 1);
  const updateArgs = updateCalls[0].ops.find((o) => o.method === "update")!.args[0] as {
    last_notified: string;
  };
  assert(typeof updateArgs.last_notified === "string");
});

Deno.test("queries nearby dark-sky places with the app's ~300-mile radius", async () => {
  // Guards against regressing to a radius so tight the nearby-places section is
  // empty for nearly every subscriber (the previous 50 km bug).
  const { handler, supabaseCalls } = harness({
    alertRows: [baseAlertRow()],
    forecastDays: [
      { datetime: "2026-06-12", moonphase: 0.5, conditions: "Clear" },
    ],
  });

  await handler(req());

  assertEquals(supabaseCalls.rpc.length, 1);
  assertEquals(supabaseCalls.rpc[0].name, "get_places");
  const args = supabaseCalls.rpc[0].args as {
    p_lat: number;
    p_lng: number;
    p_radius: number;
    p_limit_rows: number;
  };
  assertEquals(args.p_radius, 482803);
  assertEquals(args.p_lat, 30.2);
  assertEquals(args.p_lng, -97.7);
});

Deno.test("skips the email when last_notified is within the renotify window", async () => {
  const fiveDaysAgo = new Date(fixedNow().getTime() - 5 * 86400_000).toISOString();
  const { handler, sendEmail } = harness({
    alertRows: [baseAlertRow({ last_notified: fiveDaysAgo })],
    forecastDays: [
      { datetime: "2026-06-12", moonphase: 0.5, conditions: "Clear" },
    ],
  });

  const res = await handler(req());
  assertEquals(res.status, 200);
  assertEquals(sendEmail.calls.length, 0);
});

Deno.test("sends a day-of 'tonight' reminder and stamps last_dayof_notified when the optimal night is today", async () => {
  const { handler, sendEmail, supabaseCalls } = harness({
    alertRows: [baseAlertRow()],
    forecastDays: [
      // 2026-06-10 is fixedNow(): the optimal night is tonight.
      { datetime: "2026-06-10", moonphase: 0.5, conditions: "Clear" },
    ],
  });

  const res = await handler(req());
  assertEquals(res.status, 200);
  assertEquals(sendEmail.calls.length, 1);
  const [emailArgs] = sendEmail.calls[0] as [{ subject: string; html: string }];
  assert(emailArgs.subject.startsWith("Tonight:"));
  assert(emailArgs.html.includes("Optimal moon gazing tonight"));

  // The day-of column is stamped; the advance column is left untouched.
  const updateCalls = supabaseCalls.from.filter((c) =>
    c.ops.some((o) => o.method === "update")
  );
  assertEquals(updateCalls.length, 1);
  const updateArgs = updateCalls[0].ops.find((o) => o.method === "update")!
    .args[0] as Record<string, unknown>;
  assertEquals(typeof updateArgs.last_dayof_notified, "string");
  assertEquals("last_notified" in updateArgs, false);
});

Deno.test("does not resend the day-of reminder when last_dayof_notified is within the window", async () => {
  const fiveDaysAgo = new Date(fixedNow().getTime() - 5 * 86400_000).toISOString();
  const { handler, sendEmail } = harness({
    alertRows: [baseAlertRow({ last_dayof_notified: fiveDaysAgo })],
    forecastDays: [
      { datetime: "2026-06-10", moonphase: 0.5, conditions: "Clear" },
    ],
  });

  const res = await handler(req());
  assertEquals(res.status, 200);
  assertEquals(sendEmail.calls.length, 0);
});

Deno.test("still sends the day-of reminder after the advance heads-up already fired", async () => {
  // Advance went out 8 days ago (still inside the 25-day window) but the day-of
  // hasn't, and tonight is the optimal night.
  const eightDaysAgo = new Date(fixedNow().getTime() - 8 * 86400_000).toISOString();
  const { handler, sendEmail, supabaseCalls } = harness({
    alertRows: [
      baseAlertRow({ last_notified: eightDaysAgo, last_dayof_notified: null }),
    ],
    forecastDays: [
      { datetime: "2026-06-10", moonphase: 0.5, conditions: "Clear" },
    ],
  });

  const res = await handler(req());
  assertEquals(res.status, 200);
  assertEquals(sendEmail.calls.length, 1);
  const updateCalls = supabaseCalls.from.filter((c) =>
    c.ops.some((o) => o.method === "update")
  );
  const updateArgs = updateCalls[0].ops.find((o) => o.method === "update")!
    .args[0] as Record<string, unknown>;
  assertEquals(typeof updateArgs.last_dayof_notified, "string");
});

Deno.test("skips entirely (no email) when both notification stages are within the window", async () => {
  const recent = new Date(fixedNow().getTime() - 3 * 86400_000).toISOString();
  const { handler, sendEmail } = harness({
    alertRows: [
      baseAlertRow({ last_notified: recent, last_dayof_notified: recent }),
    ],
    forecastDays: [
      { datetime: "2026-06-10", moonphase: 0.5, conditions: "Clear" },
    ],
  });

  const res = await handler(req());
  assertEquals(res.status, 200);
  assertEquals(sendEmail.calls.length, 0);
});

Deno.test("skips alerts missing email/lat/lng without throwing", async () => {
  const warnSpy = console.warn;
  console.warn = () => {};
  try {
    const { handler, sendEmail } = harness({
      alertRows: [
        baseAlertRow({ users: { email: undefined } }),
        baseAlertRow({ user_locations: { lat: undefined, lng: -97 } }),
      ],
      forecastDays: [
        { datetime: "2026-06-12", moonphase: 0.5, conditions: "Clear" },
      ],
    });

    const res = await handler(req());
    assertEquals(res.status, 200);
    assertEquals(sendEmail.calls.length, 0);
  } finally {
    console.warn = warnSpy;
  }
});

Deno.test("skips the email when no optimal day is in the forecast window", async () => {
  const { handler, sendEmail } = harness({
    alertRows: [baseAlertRow()],
    forecastDays: [
      { datetime: "2026-06-12", moonphase: 0.2, conditions: "Clear" },
      { datetime: "2026-06-13", moonphase: 0.5, conditions: "Cloudy" },
    ],
  });

  const res = await handler(req());
  assertEquals(res.status, 200);
  assertEquals(sendEmail.calls.length, 0);
});

Deno.test("one alert's error does not stop the loop from processing the next", async () => {
  const errSpy = console.error;
  console.error = () => {};
  try {
    // First fetch throws, second returns a usable forecast.
    const fetched = mockFetch([
      () => {
        throw new Error("network blip");
      },
      jsonResponse({
        days: [
          { datetime: "2026-06-12", moonphase: 0.5, conditions: "Clear" },
        ],
      }),
    ]);
    const sendEmail = makeFn();
    const { client } = makeMockSupabase({
      tables: {
        alerts: (ctx) =>
          ctx.ops.some((o) => o.method === "select")
            ? {
              data: [
                baseAlertRow({ id: "first" }),
                baseAlertRow({ id: "second", user_id: "u2" }),
              ],
              error: null,
            }
            : { data: null, error: null },
      },
      rpc: () => ({ data: [], error: null }),
    });

    const handler = createHandler({
      supabase: client as never,
      fetch: fetched.fn,
      visualCrossingKey: "vc-key",
      baseUrl: "https://moongaz.ing",
      sendEmail: sendEmail.fn,
      now: fixedNow,
    });

    const res = await handler(req());
    assertEquals(res.status, 200);
    assertEquals(sendEmail.calls.length, 1);
  } finally {
    console.error = errSpy;
  }
});

Deno.test("scopes the alerts query to one alert when a token is supplied", async () => {
  const { handler, sendEmail, supabaseCalls } = harness({
    alertRows: [baseAlertRow()],
    forecastDays: [
      { datetime: "2026-06-12", moonphase: 0.5, conditions: "Clear" },
    ],
  });

  const res = await handler(
    makeRequest("POST", "https://example.com/send-moon-alerts", {
      token: "tok-1",
    }),
  );
  assertEquals(res.status, 200);

  // The read query should have filtered on the supplied unsubscribe_token...
  const readCall = supabaseCalls.from.find((c) =>
    c.table === "alerts" && c.ops.some((o) => o.method === "select")
  )!;
  assert(
    readCall.ops.some((o) =>
      o.method === "eq" && o.args[0] === "unsubscribe_token" &&
      o.args[1] === "tok-1"
    ),
  );
  // ...and the matched alert is still evaluated and emailed like normal.
  assertEquals(sendEmail.calls.length, 1);
});

Deno.test("does not filter by token for the cron call (no request body)", async () => {
  const { handler, supabaseCalls } = harness({
    alertRows: [baseAlertRow()],
    forecastDays: [
      { datetime: "2026-06-12", moonphase: 0.5, conditions: "Clear" },
    ],
  });

  await handler(req());

  const readCall = supabaseCalls.from.find((c) =>
    c.table === "alerts" && c.ops.some((o) => o.method === "select")
  )!;
  assertEquals(
    readCall.ops.some((o) =>
      o.method === "eq" && o.args[0] === "unsubscribe_token"
    ),
    false,
  );
});
