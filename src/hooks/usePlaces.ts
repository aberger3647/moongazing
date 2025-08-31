import { useEffect, useState } from "react";
import type { Place } from "../types/Place";

interface UserLocation {
  lat: number;
  lng: number;
}

interface UsePlacesOptions {
  radius?: number; // in meters
  limit?: number;
}

export function usePlaces(
  location: UserLocation | null,
  options: UsePlacesOptions = {}
) {
  const { radius = 482803, limit = 10 } = options;

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      console.log("usePlaces: no location provided yet");
      setPlaces([]);
      return;
    }

    const { lat, lng } = location;
     console.log("usePlaces: fetching places for:", { lat, lng, radius, limit });

    async function fetchPlaces() {
      setLoading(true);
      setError(null);

      try {
        console.log("Payload I’m sending:", JSON.stringify({ lat, lng, radius, limit }));
console.log("Fetch options:", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ lat, lng, radius, limit })
});

        const res = await fetch(
          "https://wbvreyzoqdqtcanrslhw.functions.supabase.co/get-places",
          {
            method: "POST",
            headers: { "Content-Type": "application/json",  "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,  },
            body: JSON.stringify({ lat, lng, radius, limit }),
          }
        );

        const json = await res.json();
        console.log("usePlaces json response: ", json);
        
        if (res.ok) {
        if (json.data) {
          setPlaces(json.data);
          console.log("usePlaces: places returned:", (json.data as Place[])?.map((d: Place) => ({
       place_name: d.place_name,
       lat: d.lat,
       lng: d.lng,
       distance: d.distance,
     })));
        } else    {
          console.warn("usePlaces: no places in response");
          setPlaces([]);
        }

        }
      } catch (err: any) {
        console.error("usePlaces fetch error:", err);
        setError(err.message);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, [location?.lat, location?.lng, radius, limit]);

  return { places, loading, error };
}
