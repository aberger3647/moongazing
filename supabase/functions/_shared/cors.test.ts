import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("corsHeaders default origin is '*' when ALLOWED_ORIGIN is unset", async () => {
  Deno.env.delete("ALLOWED_ORIGIN");
  // Cache-bust on the import so the module re-reads env each test.
  const { corsHeaders } = await import(`./cors.ts?cache-bust=${Math.random()}`);
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
  assertEquals(corsHeaders["Access-Control-Allow-Methods"], "GET, HEAD, POST, OPTIONS");
  assertEquals(
    corsHeaders["Access-Control-Allow-Headers"],
    "Content-Type, Authorization",
  );
});

Deno.test("corsHeaders honors ALLOWED_ORIGIN when set", async () => {
  Deno.env.set("ALLOWED_ORIGIN", "https://moongaz.ing");
  const { corsHeaders } = await import(`./cors.ts?cache-bust=${Math.random()}`);
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "https://moongaz.ing");
  Deno.env.delete("ALLOWED_ORIGIN");
});
