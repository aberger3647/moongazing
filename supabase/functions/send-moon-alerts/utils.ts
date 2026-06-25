export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Visual Crossing dates are calendar strings ("YYYY-MM-DD"); parse to a UTC date
// so day math doesn't drift with the server's timezone.
export function parseYmd(s: string | undefined): Date | null {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})/.exec(s) : null;
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}

// Whole days from `today` until `target` (negative if past). 0 means today.
export function daysUntil(target: Date, today: Date): number {
  const start = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return Math.round((target.getTime() - start) / 86_400_000);
}

export function titleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface DayData {
  datetime?: string;
  conditions?: string;
  moonphase?: number;
}

// Among the forecast days, find the one whose moonphase is closest to 0.5
// (the full moon) within `tolerance`, AND whose conditions include "Clear".
// Visual Crossing uses moonphase 0=new, 0.5=full, 1=new.
export function findOptimalDay(
  days: DayData[],
  tolerance: number,
): DayData | null {
  const candidates = days
    .filter(
      (d) =>
        typeof d.moonphase === "number" &&
        Math.abs(d.moonphase - 0.5) <= tolerance &&
        (d.conditions || "").includes("Clear"),
    )
    .sort(
      (a, b) =>
        Math.abs((a.moonphase as number) - 0.5) -
        Math.abs((b.moonphase as number) - 0.5),
    );
  return candidates[0] ?? null;
}

// Returns true if `lastNotified` is null or older than `renotifyDays` days
// relative to `now`. Used to avoid re-emailing for the same lunar cycle.
export function shouldRenotify(
  now: Date,
  lastNotified: string | null | undefined,
  renotifyDays: number,
): boolean {
  if (!lastNotified) return true;
  const elapsedDays =
    (now.getTime() - new Date(lastNotified).getTime()) / (1000 * 60 * 60 * 24);
  return elapsedDays >= renotifyDays;
}

export function getForecastDateRange(now: Date): {
  startDate: string;
  endDate: string;
} {
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  return { startDate: formatDate(now), endDate: formatDate(end) };
}

export function buildForecastUrl(args: {
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  apiKey: string;
}): string {
  const { lat, lng, startDate, endDate, apiKey } = args;
  return (
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/` +
    `${lat},${lng}/${startDate}/${endDate}?key=${apiKey}&include=days`
  );
}
