import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler } from "./handler.ts";
import { makeMockSupabase, makeRequest } from "../_shared/testing.ts";

Deno.test("returns 400 when token is missing", async () => {
  const { client } = makeMockSupabase();
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/unsubscribe-all-alerts", {}),
  );
  assertEquals(res.status, 400);
});

Deno.test("returns 404 when token doesn't resolve to a user", async () => {
  const { client } = makeMockSupabase({
    tables: {
      alerts: () => ({ data: null, error: { message: "no" } }),
    },
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/unsubscribe-all-alerts", { token: "bad" }),
  );
  assertEquals(res.status, 404);
});

Deno.test("reports a friendly 'no active alerts' message when count is zero", async () => {
  const { client } = makeMockSupabase({
    tables: {
      alerts: (ctx) => {
        const isResolve = ctx.ops.some((o) => o.method === "single");
        if (isResolve) return { data: { user_id: "u1" }, error: null };
        return { data: [], error: null };
      },
    },
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/unsubscribe-all-alerts", { token: "ok" }),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.count, 0);
  assertEquals(body.message, "You had no active alerts");
});

Deno.test("returns the count of deactivated alerts when there are some", async () => {
  const { client } = makeMockSupabase({
    tables: {
      alerts: (ctx) => {
        const isResolve = ctx.ops.some((o) => o.method === "single");
        if (isResolve) return { data: { user_id: "u1" }, error: null };
        return { data: [{ id: 1 }, { id: 2 }, { id: 3 }], error: null };
      },
    },
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/unsubscribe-all-alerts", { token: "ok" }),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.count, 3);
  assertEquals(body.message, "You have been unsubscribed from all alerts");
});
