export interface VisualCrossingCurrentConditions {
  sunset: string;
  visibility: number;
  cloudcover: number;
  precipprob: number;
  moonphase: number;
}

export interface VisualCrossingDay {
  datetime: string;
  conditions: string;
  cloudcover: number;
  precipprob: number;
  visibility: number;
  sunset: string;
  moonphase: number;
}

export interface VisualCrossing {
  latitude: number;
  longitude: number;
  resolvedAddress: string;
  address: string;
  timezone: string;
  tzoffset: number;
  description: string;
  feelslike: number;
  stations?: Record<string, unknown>;
  source: string;
  event: string;
  datetime: string;
  datetimeEpoch: number;
  temp: number;
  currentConditions: VisualCrossingCurrentConditions;
  days: VisualCrossingDay[];
}
