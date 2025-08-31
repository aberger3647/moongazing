export interface Place {
  id: number;
  place_name: string;
  category: string;
  lat: number;        // add this
  lng: number;        // add this
  distance?: number;  // optional, only from RPC
}
