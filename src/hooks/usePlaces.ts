import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
import type { Place } from "../types/Place";

const supabase = createClient(
supabaseUrl,
supabaseAnonKey
);

export function usePlaces(location: string | null) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    async function getPlaces() {
      // You can modify this query to use the location if needed
      const { data, error } = await supabase
        .from("dark_sky_places")
        .select("place_name");
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
