const apiKey = import.meta.env.VITE_VISUAL_CROSSING_API_KEY;
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
  if (!location) {
    throw new Error("Location is required to fetch conditions.");
  }

  const datePath = date ? `/${date}` : "";

  const params = new URLSearchParams({
    key: apiKey,
    unitGroup,
    contentType: "json",
  });

  if (include) params.append("include", include);
  if (elements) params.append("elements", elements);

  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}${datePath}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error. Status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("There was a problem fetching the data: ", error);
    throw error;
  }
}
