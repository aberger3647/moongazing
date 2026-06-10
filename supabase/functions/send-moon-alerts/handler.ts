import { SupabaseClient } from "npm:@supabase/supabase-js@2.39.2";
import { buildAlertEmail, type NearbyPlace } from "./email.ts";
import {
  buildForecastUrl,
  type DayData,
  findOptimalDay,
  getForecastDateRange,
  shouldRenotify,
} from "./utils.ts";

// A day counts as "full moon" when Visual Crossing's moonphase (0=new, 0.5=full,
// 1=new) is within this of 0.5. ~0.034 phase units ≈ 1 day, so 0.05 ≈ ±1.5 days.
export const FULL_MOON_TOLERANCE = 0.05;
// Don't email the same alert more than once per lunar cycle (~29.5 days).
export const RENOTIFY_DAYS = 25;

interface LocationRow {
  lat?: number;
  lng?: number;
  location_name?: string;
}
interface UserRow {
  email?: string;
}
interface AlertRow {
  id: number | string;
  user_locations?: LocationRow;
  users?: UserRow;
  unsubscribe_token?: string;
  last_notified?: string;
}

export interface SendAlertDeps {
  supabase: SupabaseClient;
  fetch: typeof fetch;
  sendEmail: (args: {
    to: string;
    subject: string;
    html: string;
  }) => Promise<unknown>;
  visualCrossingKey: string;
  baseUrl?: string;
  now?: () => Date;
}

// Pulls active alerts, evaluates a moon-gazing forecast for each, and sends
// emails for any alert with a clear full-moon day in the next week (subject
// to the renotify throttle). One alert's failure must not affect the others.
export function createHandler(deps: SendAlertDeps) {
  const baseUrl = deps.baseUrl ?? "https://moongaz.ing";
  const now = deps.now ?? (() => new Date());

  return async (_req: Request): Promise<Response> => {
    const { data: alerts, error } = await deps.supabase
      .from("alerts")
      .select(`
        id,
        user_id,
        location_id,
        last_notified,
        unsubscribe_token,
        users(email),
        user_locations(lat, lng, location_name)
      `)
      .eq("active", true);

    if (error) {
      console.error("Supabase fetch alerts error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    if (!alerts?.length) return new Response("No alerts", { status: 200 });

    for (const alert of alerts as AlertRow[]) {
      try {
        await processAlert(alert, deps, baseUrl, now());
      } catch (err) {
        console.error("Error processing alert", err);
      }
    }

    return new Response("Done", { status: 200 });
  };
}

async function processAlert(
  alert: AlertRow,
  deps: SendAlertDeps,
  baseUrl: string,
  today: Date,
): Promise<void> {
  const location = alert.user_locations || {};
  const user = alert.users || {};
  const lat = location.lat;
  const lng = location.lng;
  const locationName = location.location_name;

  if (!lat || !lng || !user.email) {
    console.warn("Skipping alert due to missing data", { id: alert.id });
    return;
  }

  if (!shouldRenotify(today, alert.last_notified ?? null, RENOTIFY_DAYS)) {
    return;
  }

  const { startDate, endDate } = getForecastDateRange(today);
  const url = buildForecastUrl({
    lat,
    lng,
    startDate,
    endDate,
    apiKey: deps.visualCrossingKey,
  });

  const forecastRes = await deps.fetch(url);
  const forecast = await forecastRes.json();
  const days = (forecast?.days || []) as DayData[];

  const optimalDay = findOptimalDay(days, FULL_MOON_TOLERANCE);
  if (!optimalDay) return;

  const { data: nearbyPlaces } = await deps.supabase.rpc("get_places", {
    p_lat: lat,
    p_lng: lng,
    p_radius: 50000,
    p_limit_rows: 5,
  });

  const { subject, html } = buildAlertEmail({
    location: locationName || "",
    dayData: optimalDay,
    places: (nearbyPlaces || []) as NearbyPlace[],
    unsubscribeToken: alert.unsubscribe_token || "",
    baseUrl,
  });

  await deps.sendEmail({ to: user.email, subject, html });

  await deps.supabase
    .from("alerts")
    .update({ last_notified: today.toISOString() })
    .eq("id", alert.id);
}
