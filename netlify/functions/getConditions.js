/* eslint-env node */

export async function handler(event) {
  try {
    // Parse request body from frontend
    const { location, date, include, elements, unitGroup } = JSON.parse(event.body);

    if (!location) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Location is required." }),
      };
    }

    const apiKey = process.env.VISUAL_CROSSING_API_KEY; // secret stays here
    const datePath = date ? `/${date}` : "";

    const params = new URLSearchParams({
      key: apiKey,
      unitGroup: unitGroup || "us",
      contentType: "json",
    });

    if (include) params.append("include", include);
    if (elements) params.append("elements", elements);

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}${datePath}?${params.toString()}`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data || {}),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
