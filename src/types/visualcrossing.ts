export interface VisualCrossing {
  latitude: number;
  longitude: number;
  resolvedAddress: string;
  address: string;
  timezone: string;
  tzoffset: number;
  description: string;
  feelslike: number;
  stations?: Record<string, any>; // Object with station data
  source: string;
  event: string;
  datetime: string;
  datetimeEpoch: number;
  temp: number;
  [key: string]: any;
}
