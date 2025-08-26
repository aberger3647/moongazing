import { Conditions, Alerts, Places, Moon } from "./components";
import type { MoonPhase, VisualCrossing } from "./types";
import { getConditions, determineMoonPhase, getMoonPhase } from "./utils";
import { useState, useEffect } from "react";

interface HomeProps {
  location: string | null;
  setLocation: (loc: string) => void;
}

import { usePlaces } from "./hooks/usePlaces";

export const Home = ({ location, setLocation }: HomeProps) => {
  const {
    places,
    loading: placesLoading,
    error: placesError,
  } = usePlaces(location);
  const [conditions, setConditions] = useState<VisualCrossing | null>(null);
  const [loading, setLoading] = useState(false);
  const [moonPhase, setMoonPhase] = useState<MoonPhase>("Full Moon");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);

  // get austin moon phase
  useEffect(() => {
    const fetchMoonPhase = async () => {
      try {
        const moonVal = await getMoonPhase("Austin, TX");
        if (typeof moonVal === "number") {
          const currentMoonPhase = determineMoonPhase(moonVal);
          setMoonPhase(currentMoonPhase);
        } else {
          console.log("Initial fetch returned no moonphase value");
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoonPhase();
  }, []);

  // when user submits location, set lat/long in state & get conditions
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formLocation = formData.get("location");
    if (typeof formLocation === "string" && formLocation.trim() !== "") {
      setLoading(true);
      try {
        const fetchedConditions = await getConditions({ location: formLocation });
        console.log("Fetched conditions for", formLocation, fetchedConditions);
        if (fetchedConditions && fetchedConditions.resolvedAddress) {
          setConditions(fetchedConditions);
          setLocation(fetchedConditions.resolvedAddress);
          setUserLat(fetchedConditions.latitude);
          setUserLon(fetchedConditions.longitude);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <main>
      <h1>Moongaz.ing</h1>

      <Moon size={100} phase={moonPhase} />
      <h2>{moonPhase}</h2>

      <form onSubmit={onSubmit}>
        <label htmlFor="location">Enter location</label>
        <input name="location" id="location" placeholder="city"></input>
        <button type="submit">Submit</button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : conditions && location ? (
        <>
          <h2>{conditions.resolvedAddress}</h2>
          <Conditions data={conditions} />
          <Places location={conditions.resolvedAddress} places={places} />
          <Alerts location={conditions.resolvedAddress} />
        </>
      ) : placesLoading ? (
        <p>Loading places...</p>
      ) : placesError ? (
        <p>Error loading places: {placesError}</p>
      ) : null}
    </main>
  );
};
