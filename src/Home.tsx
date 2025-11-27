import { Conditions, Alerts, Places } from "./components";
import type { MoonPhase, VisualCrossing } from "./types";
import { determineMoonPhase, getMoonPhase, getConditions, setFavicon, moonSvgs } from "./utils";
import { useState, useEffect } from "react";

interface HomeProps {
  location: string | null;
  setLocation: (loc: string) => void;
}

import { usePlaces } from "./hooks/usePlaces";

export const Home = ({ location, setLocation }: HomeProps) => {
  const [conditions, setConditions] = useState<VisualCrossing | null>(null);
  const [loading, setLoading] = useState(false);
  const [moonPhase, setMoonPhase] = useState<MoonPhase>("Full Moon");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [radius, setRadius] = useState<number>(482803);

  const userLocation =
    userLat !== null && userLon !== null ? { lat: userLat, lng: userLon } : null;

  const {
    places,
    loading: placesLoading,
    error: placesError,
  } = usePlaces(userLocation, {radius});

  // get austin moon phase
  useEffect(() => {
    const fetchMoonPhase = async () => {
      try {
        const moonVal = await getMoonPhase("Austin, TX");
        if (typeof moonVal === "number") {
          const currentMoonPhase = determineMoonPhase(moonVal);
          setMoonPhase(currentMoonPhase);
          setFavicon(currentMoonPhase);
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
    <main className="flex flex-col items-center p-5">
      <h1 className="font-herculanum text-5xl">Moongaz.ing</h1>

     {moonPhase && (
        <>
          <img
            src={moonSvgs[moonPhase]}
            alt={moonPhase}
            width={256}
            height={256}
            className="my-6"
          />
        </>
      )}
      <h2 className="font-herculanum text-3xl">{moonPhase}</h2>

      <form onSubmit={onSubmit} className="flex flex-col space-y-4 items-center my-6">
        <label htmlFor="location" className="font-herculanum text-xl">Enter Location:</label>
        <input name="location" id="location" placeholder="City" className="text-indigo-950 py-2 px-4 bg-indigo-100 rounded-xl capitalize"></input>
        <button type="submit" className="font-herculanum text-xl bg-yellow-50 text-indigo-800 py-2 px-4 w-28 rounded-full">Submit</button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : conditions && location ? (
        <>
          <h2 className="font-herculanum text-4xl mb-4 text-center">{conditions.resolvedAddress}</h2>
          <Conditions data={conditions} />
          <Places location={conditions.resolvedAddress} places={places} radius={radius} setRadius={setRadius} loading={placesLoading} />
          <Alerts
            location={conditions.resolvedAddress}
            lat={conditions.latitude}
            lng={conditions.longitude}
          />
        </>
      ) : placesLoading ? (
        <p>Loading places...</p>
      ) : placesError ? (
        <p>Error loading places: {placesError}</p>
      ) : null}
    </main>
  );
};
