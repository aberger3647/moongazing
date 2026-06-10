import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler } from "./handler.ts";
import { jsonResponse, makeRequest, mockFetch } from "../_shared/testing.ts";

Deno.test("returns 405 for non-POST methods", async () => {
  const handler = createHandler({
    fetch: () => Promise.reject(new Error("should not be called")),
    visualCrossingKey: "k",
  });
  const res = await handler(makeRequest("GET", "https://x/get-conditions"));
  assertEquals(res.status, 405);
});

Deno.test("returns 200 'ok' for OPTIONS preflight", async () => {
  const handler = createHandler({
    fetch: () => Promise.reject(new Error("should not be called")),
    visualCrossingKey: "k",
  });
  const res = await handler(makeRequest("OPTIONS", "https://x/get-conditions"));
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "ok");
});

Deno.test("returns 400 when location is missing from the body", async () => {
  const handler = createHandler({
    fetch: () => Promise.reject(new Error("should not be called")),
    visualCrossingKey: "k",
  });
  const res = await handler(
    makeRequest("POST", "https://x/get-conditions", {}),
  );
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "Location is required.");
});

Deno.test("returns 500 when VISUAL_CROSSING_API_KEY is missing", async () => {
  const handler = createHandler({
    fetch: () => Promise.reject(new Error("should not be called")),
    visualCrossingKey: undefined,
  });
  const res = await handler(
    makeRequest("POST", "https://x/get-conditions", { location: "Austin" }),
  );
  assertEquals(res.status, 500);
  assertEquals(
    (await res.json()).error,
    "VISUAL_CROSSING_API_KEY is not configured.",
  );
});

Deno.test("passes through Visual Crossing response body and status", async () => {
  const fetched = mockFetch([
    jsonResponse({ resolvedAddress: "Austin" }, { status: 200 }),
  ]);
  const handler = createHandler({ fetch: fetched.fn, visualCrossingKey: "k" });
  const res = await handler(
    makeRequest("POST", "https://x/get-conditions", { location: "Austin" }),
  );
  assertEquals(res.status, 200);
  assertEquals((await res.json()).resolvedAddress, "Austin");
  assert(fetched.calls[0].url.includes("/timeline/Austin?"));
});

Deno.test("returns 500 with the error message when fetch throws", async () => {
  const handler = createHandler({
    fetch: () => Promise.reject(new Error("network blip")),
    visualCrossingKey: "k",
  });
  const res = await handler(
    makeRequest("POST", "https://x/get-conditions", { location: "Austin" }),
  );
  assertEquals(res.status, 500);
  assertEquals((await res.json()).error, "network blip");
});
