import { useMemo } from "react";
import {
  buildCalendarEvent,
  buildGoogleCalendarUrl,
  buildIcsContent,
  formatEventDate,
  type CalendarEventKind,
} from "./utils/buildCalendarEvent";

export const AddToCalendar = () => {
  const links = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const date = params.get("date") ?? "";
    const location = params.get("location") ?? "";
    const kind: CalendarEventKind = params.get("kind") === "new" ? "new" : "full";
    const event = buildCalendarEvent({ date, location, kind });
    if (!event) return null;
    return {
      event,
      googleUrl: buildGoogleCalendarUrl(event),
      icsHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcsContent(event))}`,
      icsFilename: `moongazing-${event.kind}-${event.start}.ics`,
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="font-herculanum text-4xl tracking-display sm:text-5xl">Add to Calendar</h1>

      {!links ? (
        <div className="mt-8 w-full rounded-lg border border-red-500 bg-red-900 bg-opacity-50 p-6">
          <p className="mb-4 text-xl text-red-100">✗ Error</p>
          <p className="text-indigo-100">
            This calendar link is missing its date. Open the link from your email again.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-indigo-100">
            {links.event.title} on {formatEventDate(links.event.start)}
          </p>
          <div className="mt-8 flex w-full flex-col gap-3">
            <a href={links.googleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Add to Google Calendar
            </a>
            <a href={links.icsHref} download={links.icsFilename} className="btn btn-ghost">
              Download .ics file
            </a>
          </div>
        </>
      )}

      <p className="mt-8">
        <a href="/" className="text-yellow-50 underline hover:text-yellow-100">
          Return to home
        </a>
      </p>
    </main>
  );
};
