import { SupabaseClient } from "npm:@supabase/supabase-js@2.39.2";
import { buildAlertEmail, type NearbyPlace } from "./email.ts";
import {
  buildForecastUrl,
  type DayData,
  daysUntil,
  findOptimalDay,
  getForecastDateRange,
  parseYmd,
  type PhaseTarget,
  shouldRenotify,
} from "./utils.ts";

// A day counts as "full moon" when Visual Crossing's moonphase (0=new, 0.5=full,
// 1=new) is within this of 0.5. ~0.034 phase units ≈ 1 day, so 0.05 ≈ ±1.5 days.
export const FULL_MOON_TOLERANCE = 0.05;
// A day counts as "new moon" (darkest skies, best for stargazing) when moonphase
// is within this of 0 or 1. Same ±1.5-day tightness as the full-moon window.
export const NEW_MOON_TOLERANCE = 0.05;
// Don't email the same alert more than once per lunar cycle (~29.5 days).
export const RENOTIFY_DAYS = 25;
// How far out to look for certified dark-sky places to suggest in the email.
// 482803 m (about 300 miles), the same default the frontend's "Dark Sky Places"
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
  last_dayof_notified?: string;
  last_stargaze_notified?: string;
  last_stargaze_dayof_notified?: string;
}

// The two alert kinds evaluated for every subscriber. Each targets a different
// lunar phase and throttles via its own pair of columns so one can't suppress
// the other (full and new moon are only ~14.75 days apart).
type NotifiedColumn =
  | "last_notified"
  | "last_dayof_notified"
  | "last_stargaze_notified"
  | "last_stargaze_dayof_notified";
interface AlertKind {
  target: PhaseTarget;
  tolerance: number;
  advanceColumn: NotifiedColumn;
  dayOfColumn: NotifiedColumn;
  emailKind: "full" | "new";
}
const ALERT_KINDS: AlertKind[] = [
  {
    target: "full",
    tolerance: FULL_MOON_TOLERANCE,
    advanceColumn: "last_notified",
    dayOfColumn: "last_dayof_notified",
    emailKind: "full",
  },
  {
    target: "new",
    tolerance: NEW_MOON_TOLERANCE,
    advanceColumn: "last_stargaze_notified",
    dayOfColumn: "last_stargaze_dayof_notified",
    emailKind: "new",
  },
];

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

// Pulls active alerts and, for each, evaluates a single week-ahead forecast
// against both alert kinds — the full-moon "moon gazing" alert and the new-moon
// "stargazing" alert — emailing the subscriber about a clear night ahead. Each
// kind sends two notifications per lunar cycle (an advance heads-up the first
// time a clear qualifying night appears in the window, and a day-of reminder on
// the night itself), throttled independently via its own columns. One alert's —
// and one kind's — failure must not affect the others.
//
// Single-alert mode: when the request body carries an alert's
// `unsubscribe_token`, only that one alert is evaluated. The frontend uses this
// the moment a user subscribes so a fresh signup gets an alert right away (if a
// qualifying night is clear) instead of waiting for the next daily cron run. The
// daily pg_cron call sends no token and processes every alert.
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
        last_dayof_notified,
        last_stargaze_notified,
        last_stargaze_dayof_notified,
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

// Whether either notification stage of a kind is still open this lunar cycle.
function kindOpenness(
  alert: AlertRow,
  today: Date,
  kind: AlertKind,
): { advanceOpen: boolean; dayOfOpen: boolean } {
  return {
    advanceOpen: shouldRenotify(
      today,
      alert[kind.advanceColumn] ?? null,
      RENOTIFY_DAYS,
    ),
    dayOfOpen: shouldRenotify(
      today,
      alert[kind.dayOfColumn] ?? null,
      RENOTIFY_DAYS,
    ),
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

  if (!lat || !lng || !user.email) {
    console.warn("Skipping alert due to missing data", { id: alert.id });
    return;
  }

  // Bail before spending a forecast API call if every kind's notifications have
  // already fired this cycle.
  const anyOpen = ALERT_KINDS.some((kind) => {
    const { advanceOpen, dayOfOpen } = kindOpenness(alert, today, kind);
    return advanceOpen || dayOfOpen;
  });
  if (!anyOpen) return;

  // One forecast serves both kinds — same location and week-ahead window.
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

  for (const kind of ALERT_KINDS) {
    try {
      await evaluateKind(alert, deps, baseUrl, today, days, kind);
    } catch (err) {
      console.error("Error evaluating alert kind", kind.emailKind, err);
    }
  }
}

// Evaluate one alert kind (full or new moon) against the already-fetched
// forecast and, if a qualifying clear night is in the open stage, email the
// subscriber and stamp that kind's throttle column.
async function evaluateKind(
  alert: AlertRow,
  deps: SendAlertDeps,
  baseUrl: string,
  today: Date,
  days: DayData[],
  kind: AlertKind,
): Promise<void> {
  const email = alert.users?.email;
  const location = alert.user_locations || {};
  if (!email || !location.lat || !location.lng) return;

  const { advanceOpen, dayOfOpen } = kindOpenness(alert, today, kind);
  if (!advanceOpen && !dayOfOpen) return;

  const optimalDay = findOptimalDay(days, kind.tolerance, kind.target);
  if (!optimalDay) return;

  // The forecast window starts today, so daysUntil <= 0 means the optimal night
  // is tonight => day-of reminder; anything further out => the advance heads-up.
  const optimalDate = parseYmd(optimalDay.datetime);
  const isDayOf = optimalDate ? daysUntil(optimalDate, today) <= 0 : false;

  // Only send if the stage matching this night is still open for the cycle.
  if (isDayOf ? !dayOfOpen : !advanceOpen) return;

  const { data: nearbyPlaces } = await deps.supabase.rpc("get_places", {
    p_lat: location.lat,
    p_lng: location.lng,
    p_radius: NEARBY_RADIUS_METERS,
    p_limit_rows: NEARBY_PLACES_LIMIT,
  });

  const { subject, html } = buildAlertEmail({
    location: location.location_name || "",
    dayData: optimalDay,
    places: (nearbyPlaces || []) as NearbyPlace[],
    unsubscribeToken: alert.unsubscribe_token || "",
    baseUrl,
    today,
    kind: kind.emailKind,
  });

  await deps.sendEmail({ to: email, subject, html });

  const notifiedColumn = isDayOf ? kind.dayOfColumn : kind.advanceColumn;
  await deps.supabase
    .from("alerts")
    .update({ [notifiedColumn]: today.toISOString() })
    .eq("id", alert.id);
}
