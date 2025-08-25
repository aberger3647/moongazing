import { Conditions, Alerts, Places, Moon } from "./components";
import type { MoonPhase, VisualCrossing } from "./types";
import { getConditions, determineMoonPhase } from "./utils";
import { useState, useEffect } from "react";

interface HomeProps {
  location: string | null;
  setLocation: (loc: string) => void;
}

import { usePlaces } from "./hooks/usePlaces";

export const Home = ({ location, setLocation }: HomeProps) => {
  const { places, loading: placesLoading, error: placesError } = usePlaces(location);
  const [conditions, setConditions] = useState<VisualCrossing | null>(null);
  const [loading, setLoading] = useState(false);
  const [moonPhase, setMoonPhase] = useState<MoonPhase>("Full Moon");
  // const [userCoords, setUserCoords] = useState("0,0");

  // getting moon phase only
  useEffect(() => {
    const fetchMoonPhase = async () => {
      try {
        const conditions = await getConditions({ location: "Austin, TX" });
        if (conditions?.days?.length > 0) {
          const currentMoonPhase = determineMoonPhase(
            conditions.days[0].moonphase
          );
          setMoonPhase(currentMoonPhase);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoonPhase();
  }, []);

  // when user submits location, set location in state, get conditions for that location
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loc = formData.get("location");
    if (typeof loc === "string" && loc.trim() !== "") {
      setLocation(loc);
      setLoading(true);
      try {
        const fetchedConditions = await getConditions({ location: loc });
        if (fetchedConditions && fetchedConditions.resolvedAddress) {
          setConditions(fetchedConditions);
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
