import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler } from "./handler.ts";
import { makeMockSupabase, makeRequest } from "../_shared/testing.ts";

Deno.test("returns 400 when no token is in the query string", async () => {
  const { client } = makeMockSupabase();
  const handler = createHandler({ supabase: client as never });
  const res = await handler(makeRequest("GET", "https://x/unsubscribe"));
  assertEquals(res.status, 400);
});

Deno.test("returns 404 when no alert matches the token", async () => {
  const { client } = makeMockSupabase({
    tables: {
      alerts: () => ({ data: null, error: { message: "no rows" } }),
    },
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("GET", "https://x/unsubscribe?token=bad"),
  );
  assertEquals(res.status, 404);
});

Deno.test("deactivates the alert and returns success on a happy path", async () => {
  let updateRan = false;
  const { client } = makeMockSupabase({
    tables: {
      alerts: (ctx) => {
        const isRead = ctx.ops.some((o) => o.method === "select");
        if (isRead) return { data: { id: "a1" }, error: null };
        updateRan = true;
        return { data: null, error: null };
      },
    },
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("GET", "https://x/unsubscribe?token=good"),
  );
  assertEquals(res.status, 200);
  assertEquals((await res.json()).success, true);
  assertEquals(updateRan, true);
});

Deno.test("returns 500 when the update fails after a successful read", async () => {
  const errSpy = console.error;
  console.error = () => {};
  try {
    const { client } = makeMockSupabase({
      tables: {
        alerts: (ctx) => {
          const isRead = ctx.ops.some((o) => o.method === "select");
          if (isRead) return { data: { id: "a1" }, error: null };
          return { data: null, error: { message: "db down" } };
        },
      },
    });
    const handler = createHandler({ supabase: client as never });
    const res = await handler(
      makeRequest("GET", "https://x/unsubscribe?token=good"),
    );
    assertEquals(res.status, 500);
  } finally {
    console.error = errSpy;
  }
});
