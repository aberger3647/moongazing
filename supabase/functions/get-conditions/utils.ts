export interface BuildTimelineUrlArgs {
  location: string | number;
  date?: string;
  include?: string;
  elements?: string;
  unitGroup?: "metric" | "us";
  apiKey: string;
}

export function buildTimelineUrl(args: BuildTimelineUrlArgs): string {
  const { location, date, include, elements, unitGroup = "us", apiKey } = args;
  const datePath = date ? `/${date}` : "";
  const params = new URLSearchParams({
    key: apiKey,
    unitGroup,
    contentType: "json",
  });
  if (include) params.append("include", include);
  if (elements) params.append("elements", elements);
  return `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}${datePath}?${params.toString()}`;
}
