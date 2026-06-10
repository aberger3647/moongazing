import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler } from "./handler.ts";
import { makeMockSupabase, makeRequest } from "../_shared/testing.ts";

Deno.test("returns 500 when Supabase is not configured", async () => {
  const errSpy = console.error;
  console.error = () => {};
  try {
    const handler = createHandler({ supabase: null });
    const res = await handler(
      makeRequest("POST", "https://x/unsubscribe-alert", {
        token: "t",
        alertId: "a",
      }),
    );
    assertEquals(res.status, 500);
  } finally {
    console.error = errSpy;
  }
});

Deno.test("returns 400 when token is missing", async () => {
  const { client } = makeMockSupabase();
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/unsubscribe-alert", { alertId: "a" }),
  );
  assertEquals(res.status, 400);
});

Deno.test("returns 400 when alertId is missing", async () => {
  const { client } = makeMockSupabase();
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/unsubscribe-alert", { token: "t" }),
  );
  assertEquals(res.status, 400);
});

Deno.test("returns 404 when token doesn't match a user", async () => {
  const { client } = makeMockSupabase({
    tables: {
      alerts: () => ({ data: null, error: { message: "no" } }),
    },
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/unsubscribe-alert", {
      token: "bad",
      alertId: "a",
    }),
  );
  assertEquals(res.status, 404);
});

Deno.test("returns 404 when the alert exists but isn't owned by the token's user", async () => {
  const { client } = makeMockSupabase({
    tables: {
      alerts: (ctx) => {
        const isResolve = ctx.ops.some((o) => o.method === "single");
        if (isResolve) return { data: { user_id: "u1" }, error: null };
        // Scoped update yields zero rows (alert not owned by this user)
        return { data: [], error: null };
      },
    },
  });
  const handler = createHandler({ subscribe: undefined, supabase: client as never } as any);
  const res = await handler(
    makeRequest("POST", "https://x/unsubscribe-alert", {
      token: "good",
      alertId: "a-other",
    }),
  );
  assertEquals(res.status, 404);
});

Deno.test("returns success when the user's own alert is deactivated", async () => {
  const { client, calls } = makeMockSupabase({
    tables: {
      alerts: (ctx) => {
        const isResolve = ctx.ops.some((o) => o.method === "single");
        if (isResolve) return { data: { user_id: "u1" }, error: null };
        return { data: [{ id: "a1" }], error: null };
      },
    },
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/unsubscribe-alert", {
      token: "good",
      alertId: "a1",
    }),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);

  // The update should be scoped by both alertId AND user_id.
  const updateCall = calls.from.find((c) =>
    c.ops.some((o) => o.method === "update")
  );
  const eqArgs = updateCall!.ops.filter((o) => o.method === "eq").map((o) =>
    o.args
  );
  const eqKeys = eqArgs.map((args) => args[0] as string).sort();
  assertEquals(eqKeys, ["id", "user_id"]);
});
