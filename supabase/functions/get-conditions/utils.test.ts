import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildTimelineUrl } from "./utils.ts";

Deno.test("buildTimelineUrl defaults unitGroup to 'us' and skips the date path when omitted", () => {
  const url = buildTimelineUrl({ location: "Austin, TX", apiKey: "k" });
  assertStringIncludes(
    url,
    "/timeline/Austin, TX?",
  );
  assertStringIncludes(url, "key=k");
  assertStringIncludes(url, "unitGroup=us");
});

Deno.test("buildTimelineUrl appends date path and optional params", () => {
  const url = buildTimelineUrl({
    location: "30.2,-97.7",
    date: "2026-06-10",
    include: "days",
    elements: "moonphase",
    unitGroup: "metric",
    apiKey: "k",
  });
  assertStringIncludes(url, "/timeline/30.2,-97.7/2026-06-10?");
  assertStringIncludes(url, "unitGroup=metric");
  assertStringIncludes(url, "include=days");
  assertStringIncludes(url, "elements=moonphase");
});

Deno.test("buildTimelineUrl includes contentType=json", () => {
  const url = buildTimelineUrl({ location: "x", apiKey: "k" });
  assertStringIncludes(url, "contentType=json");
});

Deno.test("buildTimelineUrl works with numeric location", () => {
  const url = buildTimelineUrl({ location: 12345, apiKey: "k" });
  assertEquals(url.includes("/timeline/12345?"), true);
});
