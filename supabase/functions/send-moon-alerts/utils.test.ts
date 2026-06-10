import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildForecastUrl,
  findOptimalDay,
  formatDate,
  getForecastDateRange,
  shouldRenotify,
  titleCase,
} from "./utils.ts";

Deno.test("formatDate emits YYYY-MM-DD with zero-padded month and day", () => {
  assertEquals(formatDate(new Date(2026, 0, 1)), "2026-01-01");
  assertEquals(formatDate(new Date(2026, 11, 31)), "2026-12-31");
  assertEquals(formatDate(new Date(2026, 5, 9)), "2026-06-09");
});

Deno.test("titleCase capitalises each space-separated word", () => {
  assertEquals(titleCase("austin texas"), "Austin Texas");
  assertEquals(titleCase(""), "");
});

Deno.test("findOptimalDay picks the moonphase closest to 0.5 among Clear days", () => {
  const days = [
    { datetime: "2026-06-10", moonphase: 0.48, conditions: "Clear, sunny" },
    { datetime: "2026-06-11", moonphase: 0.51, conditions: "Clear" },
    { datetime: "2026-06-12", moonphase: 0.5, conditions: "Cloudy" }, // perfect phase, wrong sky
    { datetime: "2026-06-13", moonphase: 0.42, conditions: "Clear" }, // out of tolerance
  ];
  const result = findOptimalDay(days, 0.05);
  assertEquals(result?.datetime, "2026-06-11");
});

Deno.test("findOptimalDay returns null when nothing qualifies", () => {
  assertEquals(
    findOptimalDay(
      [{ moonphase: 0.5, conditions: "Cloudy" }],
      0.05,
    ),
    null,
  );
  assertEquals(findOptimalDay([], 0.05), null);
});

Deno.test("findOptimalDay ignores days with non-numeric moonphase", () => {
  assertEquals(
    findOptimalDay(
      [{ moonphase: undefined as unknown as number, conditions: "Clear" }],
      0.05,
    ),
    null,
  );
});

Deno.test("shouldRenotify returns true when no last_notified is recorded", () => {
  assert(shouldRenotify(new Date("2026-06-10"), null, 25));
  assert(shouldRenotify(new Date("2026-06-10"), undefined, 25));
});

Deno.test("shouldRenotify returns false within the renotify window", () => {
  const now = new Date("2026-06-10T00:00:00Z");
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
  assertEquals(shouldRenotify(now, tenDaysAgo, 25), false);
});

Deno.test("shouldRenotify returns true past the renotify window", () => {
  const now = new Date("2026-06-10T00:00:00Z");
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  assert(shouldRenotify(now, thirtyDaysAgo, 25));
});

Deno.test("getForecastDateRange returns a 7-day window from the given now", () => {
  const range = getForecastDateRange(new Date(2026, 5, 10));
  assertEquals(range.startDate, "2026-06-10");
  assertEquals(range.endDate, "2026-06-17");
});

Deno.test("buildForecastUrl includes coordinates, dates, key, and include=days", () => {
  const url = buildForecastUrl({
    lat: 30.2,
    lng: -97.7,
    startDate: "2026-06-10",
    endDate: "2026-06-17",
    apiKey: "k1",
  });
  assertEquals(
    url,
    "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/30.2,-97.7/2026-06-10/2026-06-17?key=k1&include=days",
  );
});
