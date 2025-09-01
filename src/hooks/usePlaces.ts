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
  const { radius = 160934, limit = 5 } = options;

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setPlaces([]);
      return;
    }

    const { lat, lng } = location;

    async function fetchPlaces() {
      setLoading(true);
      setError(null);

      try {
   const payload = { lat, lng, radius, limit };
        const res = await fetch(
          "https://wbvreyzoqdqtcanrslhw.functions.supabase.co/get-places",
          {
            method: "POST",
            headers: { "Content-Type": "application/json",  "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,  },
            body: JSON.stringify(payload),
          }
        );

        const json = await res.json();
        
        if (res.ok && json.data) {
          setPlaces(json.data);
        } else    {
          setPlaces([]);
        }

      } catch (err: any) {
        setError(err.message);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, [location?.lat, location?.lng, radius, limit]);

  return { places, loading, error, noPlaaces: !loading && places.length === 0 };
}
