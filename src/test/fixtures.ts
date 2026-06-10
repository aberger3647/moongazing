import type { Place } from "../types/Place";
import type { VisualCrossing } from "../types/visualcrossing";

export const makeVisualCrossing = (
  overrides: Partial<VisualCrossing> = {},
): VisualCrossing => ({
  latitude: 30.2672,
  longitude: -97.7431,
  resolvedAddress: "Austin, TX, USA",
  address: "Austin, TX",
  timezone: "America/Chicago",
  tzoffset: -5,
  description: "Clear skies expected.",
  feelslike: 70,
  source: "test",
  event: "",
  datetime: "2026-06-10",
  datetimeEpoch: 1749513600,
  temp: 72,
  currentConditions: {
    sunset: "20:30:00",
    visibility: 16,
    cloudcover: 5,
    precipprob: 0,
    moonphase: 0.5,
  },
  days: [{ moonphase: 0.5, conditions: "Clear", datetime: "2026-06-10" }],
  ...overrides,
});

export const makePlace = (overrides: Partial<Place> = {}): Place => ({
  id: 1,
  place_name: "Big Bend Dark Sky Park",
  category: "Park",
  lat: 29.27,
  lng: -103.25,
  distance: 5000,
  ...overrides,
});

export const makeAlert = (overrides: {
  id?: string;
  location_name?: string;
  active?: boolean;
  unsubscribe_token?: string;
} = {}) => ({
  id: "alert-1",
  location_name: "austin tx",
  active: true,
  unsubscribe_token: "tok-1",
  ...overrides,
});
