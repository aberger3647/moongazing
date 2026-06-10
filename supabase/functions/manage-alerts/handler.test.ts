import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler, formatAlert } from "./handler.ts";
import { makeMockSupabase, makeRequest } from "../_shared/testing.ts";

Deno.test("formatAlert pulls the location name out of the joined user_locations row", () => {
  const out = formatAlert({
    id: "a1",
    active: true,
    unsubscribe_token: "tok",
    user_locations: { location_name: "austin tx" },
  });
  assertEquals(out, {
    id: "a1",
    active: true,
    unsubscribe_token: "tok",
    location_name: "austin tx",
  });
});

Deno.test("formatAlert falls back to 'Unknown' when no location is joined", () => {
  const out = formatAlert({
    id: "a1",
    active: true,
    unsubscribe_token: "tok",
  });
  assertEquals(out.location_name, "Unknown");
});

Deno.test("manage-alerts returns 500 when Supabase isn't configured", async () => {
  const errSpy = console.error;
  console.error = () => {};
  try {
    const handler = createHandler({ supabase: null });
    const res = await handler(
      makeRequest("GET", "https://x/manage-alerts?token=t"),
    );
    assertEquals(res.status, 500);
  } finally {
    console.error = errSpy;
  }
});

Deno.test("manage-alerts returns 400 when no token query param is provided", async () => {
  const { client } = makeMockSupabase();
  const handler = createHandler({ supabase: client as never });
  const res = await handler(makeRequest("GET", "https://x/manage-alerts"));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "Management token required");
});

Deno.test("manage-alerts returns 404 when the token doesn't resolve to a user", async () => {
  const { client } = makeMockSupabase({
    tables: {
      alerts: () => ({ data: null, error: { message: "no rows" } }),
    },
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("GET", "https://x/manage-alerts?token=bad"),
  );
  assertEquals(res.status, 404);
});

Deno.test("manage-alerts returns formatted alerts on success", async () => {
  let alertsReadCount = 0;
  const { client } = makeMockSupabase({
    tables: {
      alerts: (ctx) => {
        // The resolveUserFromToken call uses .single(); the manage-alerts read uses .eq().eq().
        const isResolve = ctx.ops.some((o) => o.method === "single");
        if (isResolve) return { data: { user_id: "u1" }, error: null };
        alertsReadCount += 1;
        return {
          data: [
            {
              id: 1,
              active: true,
              unsubscribe_token: "tok-a",
              user_locations: { location_name: "austin tx" },
            },
            {
              id: 2,
              active: true,
              unsubscribe_token: "tok-b",
              user_locations: { location_name: "boulder co" },
            },
          ],
          error: null,
        };
      },
    },
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("GET", "https://x/manage-alerts?token=good"),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.alerts.length, 2);
  assertEquals(body.alerts[0].location_name, "austin tx");
  assertEquals(alertsReadCount, 1);
});
