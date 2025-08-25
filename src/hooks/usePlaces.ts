import { useEffect, useState } from "react";
import { supabase } from '../supabaseClient'
import type { Place } from "../types/Place";


export function usePlaces(location: string | null) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    async function getPlaces() {
      const { data, error } = await supabase.from("places").select("*");
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data) {
        setPlaces(data);
      }
      setLoading(false);
    }
    getPlaces();
  }, [location]);

  return { places, loading, error };
}
