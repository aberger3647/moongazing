import { Conditions, Alerts, Places } from "./components";
import type { MoonPhase, VisualCrossing } from "./types";
import {
  determineMoonPhase,
  getMoonPhase,
  getConditions,
  setFavicon,
  moonSvgs,
  titleCase,
} from "./utils";
import { useState, useEffect } from "react";
import { usePlaces } from "./hooks/usePlaces";

interface HomeProps {
  location: string | null;
  setLocation: (loc: string) => void;
  setCloudcover: (c: number | null) => void;
}

export const Home = ({ location, setLocation, setCloudcover }: HomeProps) => {
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
  } = usePlaces(userLocation, { radius });

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
          setCloudcover(fetchedConditions.currentConditions?.cloudcover ?? null);
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

  const hasResults = !loading && conditions && location;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:py-20">
      <header className="mx-auto flex max-w-xl flex-col items-center text-center">
        <img
          src={moonSvgs[moonPhase]}
          alt=""
          aria-hidden="true"
          width={224}
          height={224}
          className="h-40 w-40 animate-moon-float sm:h-52 sm:w-52"
        />

        <h1 className="mt-6 font-herculanum text-5xl sm:text-6xl">
          Moongaz.ing
        </h1>
        <p className="mt-3 max-w-md text-lg text-ink-soft">
          Know when the night is worth looking up.
        </p>

        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--panel-soft)] px-3.5 py-1.5 text-sm text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-moon" aria-hidden="true" />
          Tonight&rsquo;s moon · {moonPhase}
        </p>

        <form onSubmit={onSubmit} className="mt-8 w-full max-w-md">
          <label htmlFor="location" className="sr-only">
            City or location
          </label>
          <div className="flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--well)] p-1.5 pl-5 transition focus-within:border-moon focus-within:shadow-[0_0_0_3px_var(--focus)]">
            <input
              name="location"
              id="location"
              placeholder="City"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent capitalize text-ink outline-none placeholder:text-ink-mute"
            />
            <button type="submit" className="btn btn-primary shrink-0" disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </form>
      </header>

      {loading && (
        <section className="panel mt-14 p-6 sm:p-8" aria-hidden="true">
          <div className="skel h-7 w-48" />
          <div className="skel mt-4 h-4 w-3/4" />
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skel h-3 w-20" />
                <div className="skel h-6 w-14" />
              </div>
            ))}
          </div>
          <span className="sr-only">Loading conditions…</span>
        </section>
      )}

      {hasResults && (
        <section className="mt-14 space-y-6 sm:mt-16">
          <h2 className="text-center font-herculanum text-3xl sm:text-4xl" style={{ textWrap: "balance" }}>
            {titleCase(conditions.resolvedAddress)}
          </h2>
          <Conditions data={conditions} />
          <Places
            location={conditions.resolvedAddress}
            places={places}
            radius={radius}
            setRadius={setRadius}
            loading={placesLoading}
          />
          <Alerts
            location={conditions.resolvedAddress}
            lat={conditions.latitude}
            lng={conditions.longitude}
          />
        </section>
      )}

      {!loading && !conditions && placesError && (
        <p className="mt-10 text-center text-ink-mute">
          Couldn&rsquo;t load places right now. Please try again.
        </p>
      )}
    </main>
  );
};
