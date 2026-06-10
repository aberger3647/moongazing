// Parses an HH:MM:SS string and returns a localised 12-hour time like "8:30 PM".
// Throws on malformed input so callers don't silently render "Invalid Date".
export function formatTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!match) {
    throw new Error(`formatTime: expected "HH:MM:SS", got ${JSON.stringify(time)}`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] !== undefined ? Number(match[3]) : 0;
  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new Error(`formatTime: out-of-range time ${JSON.stringify(time)}`);
  }

  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
