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
  // render() defaults today to 2026-06-10, so this optimal night is tonight.
  const { subject, html } = render("2026-06-10");
  assertEquals(subject, "Tonight: Moon Gazing in Austin Tx");
  assertStringIncludes(html, "Austin Tx");
  assertStringIncludes(html, "June 10");
  assertStringIncludes(html, "tok-1");
});

Deno.test("subject leads with 'Tonight' on the night itself and 'Alert' for an advance night", () => {
  // Same day => the day-of reminder; a future night => the advance heads-up.
  assertEquals(render("2026-06-10").subject, "Tonight: Moon Gazing in Austin Tx");
  assertEquals(render("2026-06-13").subject, "Moon Gazing Alert for Austin Tx");
});

Deno.test("heading says 'tonight' only when the optimal night is today", () => {
  assertStringIncludes(render("2026-06-10").html, "Optimal moon gazing tonight");
});

Deno.test("heading says 'tomorrow night' for the next day", () => {
  const { html } = render("2026-06-11");
  assertStringIncludes(html, "Optimal moon gazing tomorrow night");
  assert(!html.includes("gazing tonight"));
});

Deno.test("heading names the weekday for a night later this week", () => {
  // 2026-06-13 is a Saturday; the alert is generated Wed 2026-06-10.
  const { html } = render("2026-06-13");
  assertStringIncludes(html, "Optimal moon gazing Saturday night");
  assert(!html.includes("gazing tonight"));
});

Deno.test("heading falls back to the full date a week out", () => {
  // 7 days out lands on the same weekday as today, so spell the date instead.
  const { html } = render("2026-06-17");
  assertStringIncludes(html, "Optimal moon gazing on Wednesday, June 17");
  assert(!html.includes("gazing tonight"));
});

Deno.test("email copy contains no em dashes", () => {
  assert(!render("2026-06-13").html.includes("—"));
});

Deno.test("moon image carries a cream placeholder so it doesn't flash in or break before loading", () => {
  // The <img> and its wrapper get the moon's base color, so a slow or blocked
  // image shows a filled disc instead of an empty box / broken-image icon.
  assertStringIncludes(render("2026-06-13").html, "background-color: #f3e5a6");
});

Deno.test("buildAlertEmail omits the nearby-places block when none are supplied", () => {
  assert(!render("2026-06-10").html.includes("Where to Gaze"));
});

Deno.test("buildAlertEmail CTA deep-links to the alert's location", () => {
  const { html } = render("2026-06-10");
  // "See the forecast" should open this location's forecast, not the bare home
  // page (the frontend reads ?location=).
  assertStringIncludes(html, "?location=austin%20tx");
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
  assertStringIncludes(html, "Where to Gaze");
  assertStringIncludes(html, "Big Bend");
  assertStringIncludes(html, "7 miles away");
  assertStringIncludes(html, "Enchanted Rock");
  assertStringIncludes(html, "31 miles away");
});

Deno.test("buildAlertEmail draws dividers only between places, not under the last", () => {
  const { html } = buildAlertEmail({
    location: "austin tx",
    dayData: { datetime: "2026-06-10" },
    places: [
      { place_name: "Big Bend", category: "Park", distance: 12345 },
      { place_name: "Enchanted Rock", category: "Park", distance: 50000 },
    ],
    unsubscribeToken: "tok",
    baseUrl: "https://moongaz.ing",
    today: new Date("2026-06-10T00:00:00Z"),
  });
  // Two places => exactly one separator line (between them), none trailing.
  const dividers = html.split("border-bottom: 1px solid #2f2f5c").length - 1;
  assertEquals(dividers, 1);
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
