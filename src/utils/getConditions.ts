const apiKey = import.meta.env.VITE_VISUAL_CROSSING_API_KEY;
import { VisualCrossing } from "../types/visualcrossing";

export async function getConditions(location: string | FormDataEntryValue | null): Promise<VisualCrossing> {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error. Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("data: ", data)
    return data;
  } catch (error) {
    console.error("There was a problem fetching the data: ", error);
    throw error;
  }
}
