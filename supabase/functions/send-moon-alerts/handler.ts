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
// How far out to look for certified dark-sky places to suggest in the email.
// 482803 m ≈ 300 miles — the same default the frontend's "Dark Sky Places"
// list uses. The previous 50 km was tighter than even the smallest UI option
// (100 mi) and, since only a few hundred such places exist worldwide, left the
// email's nearby-places section empty for nearly every subscriber.
export const NEARBY_RADIUS_METERS = 482803;
export const NEARBY_PLACES_LIMIT = 5;

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

// Best-effort: pull an alert's `unsubscribe_token` out of the request body to
// scope the run to a single alert. Returns null for the daily cron call (which
// sends no token) or any body that isn't JSON / lacks a usable token, so those
// fall through to evaluating every active alert.
async function readAlertToken(req: Request): Promise<string | null> {
  try {
    const body = await req.json();
    const token = body?.token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

// Pulls active alerts, evaluates a moon-gazing forecast for each, and sends
// emails for any alert with a clear full-moon day in the next week (subject
// to the renotify throttle). One alert's failure must not affect the others.
//
// Single-alert mode: when the request body carries an alert's
// `unsubscribe_token`, only that one alert is evaluated. The frontend uses this
// the moment a user subscribes so a fresh signup gets the moon alert right away
// (if the upcoming full moon is clear) instead of waiting for the next daily
// cron run. The daily pg_cron call sends no token and processes every alert.
export function createHandler(deps: SendAlertDeps) {
  const baseUrl = deps.baseUrl ?? "https://moongaz.ing";
  const now = deps.now ?? (() => new Date());

  return async (req: Request): Promise<Response> => {
    const token = await readAlertToken(req);

    let query = deps.supabase
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
    if (token) query = query.eq("unsubscribe_token", token);

    const { data: alerts, error } = await query;

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
    p_radius: NEARBY_RADIUS_METERS,
    p_limit_rows: NEARBY_PLACES_LIMIT,
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
