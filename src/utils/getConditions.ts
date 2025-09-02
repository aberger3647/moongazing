import type { VisualCrossing } from "../types";

interface GetConditionsParams {
  location: string | FormDataEntryValue | null;
  date?: string; // format: YYYY-MM-DD
  include?: string; // eg "days, hours, alerts"
  elements?: string; // eg "moonphase, sunrise, sunset, temp, humidity"
  unitGroup?: "metric" | "us";
}

export async function getConditions({
  location,
  date,
  include,
  elements,
  unitGroup = "us",
}: GetConditionsParams): Promise<VisualCrossing> {
  if (!location) throw new Error("Location is required");

  const res = await fetch("/api/getConditions", {
    method: "POST",
    body: JSON.stringify({ location, date, include, elements, unitGroup }),
    headers: { "Content-Type": "application/json" },
  });

  const text = await res.text();

  if (!res.ok) {
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.error || `HTTP error: ${res.status}`);
    } catch {
      throw new Error(`HTTP error: ${res.status} - ${text}`);
    }
  }

  if (!text) {
    throw new Error("Empty response from server");
  }

  try {
    const data = JSON.parse(text);
    return data;
  } catch (err) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }
}
