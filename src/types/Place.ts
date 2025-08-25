export interface Place {
  place_name: string;
  id: number;
  category?: string;
  coords?: string; // raw coords string if present
}
