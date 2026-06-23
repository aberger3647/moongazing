import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildAlertEmail } from "./email.ts";

// Convenience: render an email for a given optimal-night date and "today".
// 2026-06-10 is a Wednesday, which the weekday-phrasing tests below rely on.
function render(datetime: string, todayIso = "2026-06-10T00:00:00Z") {
  return buildAlertEmail({
    location: "austin tx",
    dayData: { datetime, moonphase: 0.5, conditions: "Clear" },
    places: [],
    unsubscribeToken: "tok-1",
    baseUrl: "https://moongaz.ing",
    today: new Date(todayIso),
  });
}

Deno.test("buildAlertEmail subject and body title-case the location and spell out the date", () => {
  const { subject, html } = render("2026-06-10");
  assertEquals(subject, "Moon Gazing Alert for Austin Tx");
  assertStringIncludes(html, "Austin Tx");
  assertStringIncludes(html, "June 10");
  assertStringIncludes(html, "tok-1");
});

Deno.test("heading says 'tonight' only when the optimal night is today", () => {
  assertStringIncludes(render("2026-06-10").html, "Optimal Moon Gazing tonight");
});

Deno.test("heading says 'tomorrow night' for the next day", () => {
  const { html } = render("2026-06-11");
  assertStringIncludes(html, "Optimal Moon Gazing tomorrow night");
  assert(!html.includes("Gazing tonight"));
});

Deno.test("heading names the weekday for a night later this week", () => {
  // 2026-06-13 is a Saturday; the alert is generated Wed 2026-06-10.
  const { html } = render("2026-06-13");
  assertStringIncludes(html, "Optimal Moon Gazing Saturday night");
  assert(!html.includes("Gazing tonight"));
});

Deno.test("heading falls back to the full date a week out", () => {
  // 7 days out lands on the same weekday as today, so spell the date instead.
  const { html } = render("2026-06-17");
  assertStringIncludes(html, "Optimal Moon Gazing on Wednesday, June 17");
  assert(!html.includes("Gazing tonight"));
});

Deno.test("email copy contains no em dashes", () => {
  assert(!render("2026-06-13").html.includes("—"));
});

Deno.test("buildAlertEmail omits the nearby-places block when none are supplied", () => {
  assert(!render("2026-06-10").html.includes("Nearby Certified Dark Sky Places"));
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
    today: new Date("2026-06-10T00:00:00Z"),
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
    today: new Date("2026-06-10T00:00:00Z"),
  });
  assertStringIncludes(
    html,
    'href="https://example.com/manage-alerts?token=abc"',
  );
});
