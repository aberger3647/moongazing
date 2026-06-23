import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildAlertEmail } from "./email.ts";

Deno.test("buildAlertEmail subject and body title-case the location and embed the date", () => {
  const { subject, html } = buildAlertEmail({
    location: "austin tx",
    dayData: { datetime: "2026-06-10", moonphase: 0.5, conditions: "Clear" },
    places: [],
    unsubscribeToken: "tok-1",
    baseUrl: "https://moongaz.ing",
  });
  assertEquals(subject, "Moon Gazing Alert for Austin Tx");
  assertStringIncludes(html, "Austin Tx");
  assertStringIncludes(html, "2026-06-10");
  assertStringIncludes(html, "tok-1");
});

Deno.test("buildAlertEmail omits the nearby-places block when none are supplied", () => {
  const { html } = buildAlertEmail({
    location: "remote",
    dayData: { datetime: "2026-06-10" },
    places: [],
    unsubscribeToken: "tok",
    baseUrl: "https://x",
  });
  assert(!html.includes("Nearby Certified Dark Sky Places"));
});

Deno.test("buildAlertEmail lists nearby places with distance in whole miles", () => {
  const { html } = buildAlertEmail({
    location: "austin tx",
    dayData: { datetime: "2026-06-10" },
    places: [
      // distances are meters from the get_places RPC; rendered as floored miles
      { place_name: "Big Bend", category: "Park", distance: 12345 },
      { place_name: "Enchanted Rock", category: "Park", distance: 50000 },
    ],
    unsubscribeToken: "tok",
    baseUrl: "https://moongaz.ing",
  });
  assertStringIncludes(html, "Nearby Certified Dark Sky Places");
  assertStringIncludes(html, "Big Bend");
  assertStringIncludes(html, "7 miles away");
  assertStringIncludes(html, "Enchanted Rock");
  assertStringIncludes(html, "31 miles away");
});

Deno.test("buildAlertEmail manage-alerts link includes baseUrl and token", () => {
  const { html } = buildAlertEmail({
    location: "austin",
    dayData: { datetime: "2026-06-10" },
    places: [],
    unsubscribeToken: "abc",
    baseUrl: "https://example.com",
  });
  assertStringIncludes(
    html,
    'href="https://example.com/manage-alerts?token=abc"',
  );
});
