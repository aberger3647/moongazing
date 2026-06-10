import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler } from "./handler.ts";
import { makeMockSupabase, makeRequest } from "../_shared/testing.ts";

Deno.test("returns 200 'ok' for OPTIONS preflight", async () => {
  const handler = createHandler({ supabase: null });
  const res = await handler(makeRequest("OPTIONS", "https://x/get-places"));
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "ok");
});

Deno.test("returns 500 when Supabase is not configured", async () => {
  const handler = createHandler({ supabase: null });
  const res = await handler(
    makeRequest("POST", "https://x/get-places", { lat: 1, lng: 2 }),
  );
  assertEquals(res.status, 500);
  const body = await res.json();
  assertEquals(body.error.message, "Service not configured");
});

Deno.test("returns 400 when the body is not JSON", async () => {
  const { client } = makeMockSupabase();
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    new Request("https://x/get-places", { method: "POST", body: "not json" }),
  );
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error.message, "Invalid JSON body");
});

Deno.test("calls the get_places RPC with lat/lng/radius/limit and wraps the result", async () => {
  const { client, calls } = makeMockSupabase({
    rpc: () => ({
      data: [
        { id: 1, place_name: "Big Bend", category: "Park", lat: 0, lng: 0, distance: 100 },
      ],
      error: null,
    }),
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/get-places", { lat: 30, lng: -97 }),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.data.length, 1);
  assertEquals(body.data[0].place_name, "Big Bend");
  assertEquals(calls.rpc[0].name, "get_places");
  assertEquals(calls.rpc[0].args, {
    p_lat: 30,
    p_lng: -97,
    p_radius: 482803,
    p_limit_rows: 10,
  });
});

Deno.test("applies caller-provided radius and limit", async () => {
  const { client, calls } = makeMockSupabase({
    rpc: () => ({ data: [], error: null }),
  });
  const handler = createHandler({ supabase: client as never });
  await handler(
    makeRequest("POST", "https://x/get-places", {
      lat: 30,
      lng: -97,
      radius: 1000,
      limit: 5,
    }),
  );
  assertEquals(calls.rpc[0].args, {
    p_lat: 30,
    p_lng: -97,
    p_radius: 1000,
    p_limit_rows: 5,
  });
});

Deno.test("returns 500 with the RPC error message when the call fails", async () => {
  const { client } = makeMockSupabase({
    rpc: () => ({ data: null, error: { message: "rpc boom" } }),
  });
  const handler = createHandler({ supabase: client as never });
  const res = await handler(
    makeRequest("POST", "https://x/get-places", { lat: 1, lng: 2 }),
  );
  assertEquals(res.status, 500);
  assertEquals((await res.json()).error.message, "rpc boom");
});
