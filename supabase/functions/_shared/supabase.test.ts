import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { json, preflight, resolveUserFromToken } from "./supabase.ts";
import { makeMockSupabase, makeRequest } from "./testing.ts";

Deno.test("json() returns the body, status, and merges CORS + content-type headers", async () => {
  const res = json({ hello: "world" }, 201);
  assertEquals(res.status, 201);
  assertEquals(res.headers.get("Content-Type"), "application/json");
  assert(res.headers.get("Access-Control-Allow-Origin"));
  assertEquals(await res.json(), { hello: "world" });
});

Deno.test("json() defaults to 200", () => {
  const res = json({});
  assertEquals(res.status, 200);
});

Deno.test("preflight() returns a 200 'ok' for OPTIONS", async () => {
  const res = preflight(makeRequest("OPTIONS", "https://example.com/x"));
  assert(res !== null);
  assertEquals(res!.status, 200);
  assertEquals(await res!.text(), "ok");
});

Deno.test("preflight() returns null for non-OPTIONS methods", () => {
  for (const method of ["GET", "POST", "PUT", "DELETE", "HEAD"]) {
    assertEquals(preflight(makeRequest(method, "https://example.com/x")), null);
  }
});

Deno.test("resolveUserFromToken returns userId on a single-row match", async () => {
  const { client } = makeMockSupabase({
    tables: {
      alerts: () => ({ data: { user_id: "user-1" }, error: null }),
    },
  });

  const result = await resolveUserFromToken(client as never, "tok-1");
  assert(result.ok);
  if (result.ok) assertEquals(result.userId, "user-1");
});

Deno.test("resolveUserFromToken returns a 404 response when token is unknown", async () => {
  const { client } = makeMockSupabase({
    tables: {
      alerts: () => ({ data: null, error: { message: "no rows" } }),
    },
  });

  const result = await resolveUserFromToken(client as never, "bad-token");
  assert(!result.ok);
  if (!result.ok) {
    assertEquals(result.response.status, 404);
    const body = await result.response.json();
    assertEquals(body.error, "Invalid or expired management token");
  }
});
