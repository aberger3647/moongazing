import { titleCase } from "./titleCase";

// Mirrors send-moon-alerts/email.ts's AlertEmailKind. Not imported from
// there — src/ and supabase/functions/ are separate TS projects with no
// shared module graph (titleCase itself is already duplicated the same way).
export type CalendarEventKind = "full" | "new";

export interface CalendarEventInput {
  /** "YYYY-MM-DD"; tolerates a longer ISO string (only the date prefix is used). */
  date: string;
  /** Free-text location name; "" degrades gracefully. */
  location: string;
  kind: CalendarEventKind;
}

export interface CalendarEvent {
  kind: CalendarEventKind;
  title: string;
  description: string;
  /** Title-cased; "" if no location was given. */
  location: string;
  /** Inclusive start, YYYYMMDD. */
  start: string;
  /** Exclusive end (start + 1 calendar day) — RFC 5545 requires this for all-day events. */
  end: string;
}

const COPY: Record<CalendarEventKind, { activity: string; blurb: string }> = {
  full: { activity: "Moon Gazing", blurb: "The full moon will be visible" },
  new: { activity: "Stargazing", blurb: "The new moon brings dark, moonless skies" },
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function nextDayParts(y: number, m: number, d: number): { y: number; m: number; d: number } {
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return { y: next.getUTCFullYear(), m: next.getUTCMonth() + 1, d: next.getUTCDate() };
}

export function buildCalendarEvent(input: CalendarEventInput): CalendarEvent | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.date ?? "");
  if (!m) return null;
  const start = `${m[1]}${m[2]}${m[3]}`;
  const nd = nextDayParts(+m[1], +m[2], +m[3]);
  const end = `${nd.y}${pad2(nd.m)}${pad2(nd.d)}`;

  const location = input.location ? titleCase(input.location) : "";
  const copy = COPY[input.kind];
  const title = `${copy.activity}${location ? ` in ${location}` : ""}`;
  const description =
    `${copy.blurb}${location ? ` over ${location}` : ""}. Clear skies are forecast.`;

  return { kind: input.kind, title, description, location, start, end };
}

// Google's "quick add" template URL. `dates` is built by hand — not run through
// encodeURIComponent/URLSearchParams — because it's pure digits and a literal
// "/"; a generic encoder percent-escapes that to %2F, which still round-trips
// but diverges from every published Google example (dates=YYYYMMDD/YYYYMMDD).
export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const parts = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(event.title)}`,
    `dates=${event.start}/${event.end}`,
    `details=${encodeURIComponent(event.description)}`,
  ];
  if (event.location) parts.push(`location=${encodeURIComponent(event.location)}`);
  return `https://calendar.google.com/calendar/render?${parts.join("&")}`;
}

// RFC 5545 §3.3.11 TEXT escaping. Backslash MUST be escaped first, or the
// backslashes introduced by the other replacements get re-escaped.
function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// RFC 5545 §3.1: content lines SHOULD NOT exceed 75 octets; longer lines fold
// onto a continuation line starting with a single space. Not theoretical here —
// a typical DESCRIPTION line runs ~83 chars.
function foldLine(line: string): string {
  const LIMIT = 75;
  if (line.length <= LIMIT) return line;
  let out = line.slice(0, LIMIT);
  let rest = line.slice(LIMIT);
  while (rest.length > 0) {
    out += "\r\n " + rest.slice(0, LIMIT - 1);
    rest = rest.slice(LIMIT - 1);
  }
  return out;
}

function icsTimestamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

// `now` is injectable so DTSTAMP is deterministic in tests — mirrors the
// today/now clock-injection pattern already used in email.ts / handler.ts.
export function buildIcsContent(event: CalendarEvent, now: Date = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Moongazing//Add to Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.start}-${event.kind}@moongaz.ing`,
    `DTSTAMP:${icsTimestamp(now)}`,
    `DTSTART;VALUE=DATE:${event.start}`,
    `DTEND;VALUE=DATE:${event.end}`,
    foldLine(`SUMMARY:${escapeIcsText(event.title)}`),
    foldLine(`DESCRIPTION:${escapeIcsText(event.description)}`),
    ...(event.location ? [foldLine(`LOCATION:${escapeIcsText(event.location)}`)] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

// "Saturday, June 13" — matches the email's date phrasing. Pinned to UTC so
// the displayed date can't shift a day for users west of UTC.
export function formatEventDate(start: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(start);
  if (!m) return start;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  }).format(d);
}
