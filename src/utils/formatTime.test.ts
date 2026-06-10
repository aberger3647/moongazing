import { describe, expect, it } from "vitest";
import { formatTime } from "./formatTime";

// Use a fresh Date with the same time components to compute the
// locale-dependent expected value, so the test is portable across CI locales.
const expected = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

describe("formatTime", () => {
  it("formats a typical sunset time", () => {
    expect(formatTime("20:30:00")).toBe(expected(20, 30));
  });

  it("formats noon and midnight at the 12-hour boundary", () => {
    expect(formatTime("12:00:00")).toBe(expected(12, 0));
    expect(formatTime("00:00:00")).toBe(expected(0, 0));
  });

  it("formats a single-digit morning hour", () => {
    expect(formatTime("09:05:00")).toBe(expected(9, 5));
  });

  it("accepts HH:MM with seconds omitted", () => {
    expect(formatTime("06:45")).toBe(expected(6, 45));
  });

  it("matches a 12-hour AM/PM shape", () => {
    expect(formatTime("13:00:00")).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
  });

  it("throws on malformed input", () => {
    expect(() => formatTime("")).toThrow();
    expect(() => formatTime("not a time")).toThrow();
    expect(() => formatTime("8:30")).not.toThrow();
    expect(() => formatTime("25:00:00")).toThrow();
    expect(() => formatTime("12:60:00")).toThrow();
  });
});
