import { describe, expect, it } from "vitest";
import {
  buildCalendarEvent,
  buildGoogleCalendarUrl,
  buildIcsContent,
  formatEventDate,
} from "./buildCalendarEvent";

describe("buildCalendarEvent", () => {
  it("computes an exclusive end date one calendar day after start", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "", kind: "full" });
    expect(event?.start).toBe("20260613");
    expect(event?.end).toBe("20260614");
  });

  it("rolls the end date over a month boundary", () => {
    const event = buildCalendarEvent({ date: "2026-01-31", location: "", kind: "full" });
    expect(event?.end).toBe("20260201");
  });

  it("rolls the end date over a year boundary", () => {
    const event = buildCalendarEvent({ date: "2026-12-31", location: "", kind: "full" });
    expect(event?.end).toBe("20270101");
  });

  it("title-cases the location", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "austin tx", kind: "full" });
    expect(event?.location).toBe("Austin Tx");
    expect(event?.title).toBe("Moon Gazing in Austin Tx");
  });

  it("degrades gracefully with no location", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "", kind: "full" });
    expect(event?.location).toBe("");
    expect(event?.title).toBe("Moon Gazing");
    expect(event?.description).toBe("The full moon will be visible. Clear skies are forecast.");
    expect(event?.title).not.toContain("undefined");
    expect(event?.description).not.toContain(" over .");
  });

  it("swaps in the stargazing copy for kind 'new'", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "austin tx", kind: "new" });
    expect(event?.title).toBe("Stargazing in Austin Tx");
    expect(event?.description).toBe(
      "The new moon brings dark, moonless skies over Austin Tx. Clear skies are forecast.",
    );
  });

  it("returns null when the date is missing", () => {
    expect(buildCalendarEvent({ date: "", location: "austin", kind: "full" })).toBeNull();
  });

  it("returns null when the date is unparseable", () => {
    expect(buildCalendarEvent({ date: "not-a-date", location: "austin", kind: "full" })).toBeNull();
  });

  it("tolerates a full ISO datetime, using only the date prefix", () => {
    const event = buildCalendarEvent({
      date: "2026-06-13T00:00:00Z",
      location: "",
      kind: "full",
    });
    expect(event?.start).toBe("20260613");
    expect(event?.end).toBe("20260614");
  });
});

describe("buildGoogleCalendarUrl", () => {
  it("builds a quick-add URL with an unencoded dates range and encoded text fields", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "austin tx", kind: "full" })!;
    const url = buildGoogleCalendarUrl(event);
    expect(url).toContain("https://calendar.google.com/calendar/render?action=TEMPLATE");
    expect(url).toContain("dates=20260613/20260614");
    expect(url).not.toContain("dates=20260613%2F20260614");
    expect(url).toContain("text=Moon%20Gazing%20in%20Austin%20Tx");
    expect(url).toContain("location=Austin%20Tx");
  });

  it("omits the location param entirely when there's no location", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "", kind: "full" })!;
    const url = buildGoogleCalendarUrl(event);
    expect(url).not.toContain("location=");
  });
});

describe("buildIcsContent", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("matches the expected RFC 5545 output, including folding a long DESCRIPTION", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "austin tx", kind: "full" })!;
    const ics = buildIcsContent(event, now);
    expect(ics).toBe(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Moongazing//Add to Calendar//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        "UID:20260613-full@moongaz.ing",
        "DTSTAMP:20260601T120000Z",
        "DTSTART;VALUE=DATE:20260613",
        "DTEND;VALUE=DATE:20260614",
        "SUMMARY:Moon Gazing in Austin Tx",
        "DESCRIPTION:The full moon will be visible over Austin Tx. Clear skies are f",
        " orecast.",
        "LOCATION:Austin Tx",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
      ].join("\r\n"),
    );
  });

  it("uses CRLF line endings throughout, never a bare LF", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "austin tx", kind: "full" })!;
    const ics = buildIcsContent(event, now);
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("wraps every physical line at 75 characters, with continuations indented by one space", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "austin tx", kind: "full" })!;
    const ics = buildIcsContent(event, now);
    const lines = ics.split("\r\n").filter((l) => l.length > 0);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(75);
    expect(lines.some((l) => l.startsWith(" "))).toBe(true);
  });

  it("omits the LOCATION line entirely when there's no location", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "", kind: "full" })!;
    const ics = buildIcsContent(event, now);
    expect(ics).not.toContain("LOCATION:");
  });

  it("escapes commas in a location like 'austin, texas'", () => {
    const event = buildCalendarEvent({ date: "2026-06-13", location: "austin, texas", kind: "full" })!;
    const ics = buildIcsContent(event, now);
    expect(ics).toContain("LOCATION:Austin\\, Texas");
  });
});

describe("formatEventDate", () => {
  it("spells out the weekday and month, matching the email's date phrasing", () => {
    // 2026-06-13 is a Saturday (see the shared assumption in send-moon-alerts/email.test.ts).
    expect(formatEventDate("20260613")).toBe("Saturday, June 13");
  });

  it("falls back to the raw input when unparseable", () => {
    expect(formatEventDate("not-a-date")).toBe("not-a-date");
  });
});
