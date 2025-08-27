import { useEffect, useState } from "react";
import { supabase } from '../supabaseClient';
import type { Place } from "../types/Place";

type UserLocation = {
  lat: number;
  lng: number;
};

interface UsePlacesOptions {
  radiusMeters?: number;
  limit?: number;
}

export function usePlaces(
  location: UserLocation | null,
  options: UsePlacesOptions = {}
) {
  const { radiusMeters = 5000, limit = 10 } = options;

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setPlaces([]);
      return; // exit early if location is null
    }

    const { lat, lng } = location; // destructure safely

    setLoading(true);
    setError(null);

    async function getPlaces() {
      const query = `
        SELECT
          id,
          place_name,
          category,
          lat,
          lng,
          ST_Distance(
            location,
            ST_MakePoint(${lng}, ${lat})::geography
          ) AS distance
        FROM places
        WHERE ST_DWithin(
          location,
          ST_MakePoint(${lng}, ${lat})::geography,
          ${radiusMeters}
        )
        ORDER BY distance
        LIMIT ${limit};
      `;

      const { data, error } = await supabase.rpc('sql', { sql: query });

      if (error) {
        setError(error.message);
        setPlaces([]);
      } else {
        setPlaces(data || []);
      }

      setLoading(false);
    }

    getPlaces();
  }, [location, radiusMeters, limit]);

  return { places, loading, error };
}
