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
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { usePlaces } from "./hooks/usePlaces";

interface HomeProps {
  location: string | null;
  setLocation: (loc: string) => void;
  setCloudcover: (c: number | null) => void;
}

export const Home = ({ location, setLocation, setCloudcover }: HomeProps) => {
  const [conditions, setConditions] = useState<VisualCrossing | null>(null);
  const [loading, setLoading] = useState(false);
  const [moonPhase, setMoonPhase] = useState<MoonPhase | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  // Browser geolocation ("Use my current location") runs before runSearch takes
  // over, so it tracks its own pending/error state.
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(482803);
  const [searchParams] = useSearchParams();
  // The alert email's "See the forecast" links here as /?location=<city>.
  const initialLocation = searchParams.get("location") ?? "";

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
          // Fall back to a real phase so the skeleton doesn't linger forever.
          setMoonPhase("Full Moon");
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setMoonPhase("Full Moon");
      } finally {
        setLoading(false);
      }
    };

    fetchMoonPhase();
  }, []);

  // Resolve a location string to conditions and push it into state. Shared by
  // the search form and the email deep-link below.
  const runSearch = useCallback(
    async (rawLocation: string) => {
      if (!rawLocation.trim()) return;
      setLoading(true);
      try {
        const fetchedConditions = await getConditions({ location: rawLocation });
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
    },
    [setLocation, setCloudcover],
  );

  // when user submits location, set lat/long in state & get conditions
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formLocation = formData.get("location");
    if (typeof formLocation === "string") void runSearch(formLocation);
  };

  // Auto-detect the visitor's location, then resolve it through the same search
  // path: Visual Crossing accepts a "lat,lng" string and returns a readable
  // resolvedAddress, so the results render exactly as a typed search would.
  const onUseMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Location isn't supported by this browser.");
      return;
    }
    setGeoError(null);
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const { latitude, longitude } = pos.coords;
        void runSearch(`${latitude},${longitude}`);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Enter a city instead."
            : "Couldn't detect your location. Enter a city instead.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, [runSearch]);

  // Deep link from the alert email: load the alert's location on arrival so the
  // CTA lands on that place's forecast instead of the empty home screen. Once.
  useEffect(() => {
    if (initialLocation.trim()) void runSearch(initialLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasResults = !loading && conditions && location;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:py-20">
      <header className="mx-auto flex max-w-xl flex-col items-center text-center">
        {/* Hold the moon's place with a circular skeleton until the real phase
            resolves, so the full moon doesn't flash before the correct image. */}
        {moonPhase ? (
          <img
            src={moonSvgs[moonPhase]}
            alt=""
            aria-hidden="true"
            width={224}
            height={224}
            className="h-40 w-40 sm:h-52 sm:w-52"
          />
        ) : (
          <div
            className="skel h-40 w-40 rounded-full sm:h-52 sm:w-52"
            aria-hidden="true"
          />
        )}

        <h1 className="mt-6 font-herculanum text-5xl sm:text-6xl">
          Moongaz.ing
        </h1>

        {moonPhase ? (
          <p className="mt-4 font-herculanum text-xl text-ink-soft sm:text-2xl">
            {moonPhase}
          </p>
        ) : (
          <div
            className="skel mt-5 h-6 w-40 rounded sm:mt-6 sm:h-7"
            aria-hidden="true"
          />
        )}

        <form onSubmit={onSubmit} className="mt-8 w-full max-w-md">
          <label htmlFor="location" className="sr-only">
            City or location
          </label>
          <div className="flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--well)] p-1.5 pl-5 transition focus-within:border-moon">
            <input
              name="location"
              id="location"
              placeholder="City"
              autoComplete="off"
              defaultValue={initialLocation}
              className="min-w-0 flex-1 bg-transparent capitalize text-ink outline-none placeholder:text-ink-mute"
            />
            <button type="submit" className="btn btn-primary shrink-0" disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </form>

        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={loading || geoLoading}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-mute transition hover:text-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {geoLoading ? "Detecting your location…" : "Use my current location"}
        </button>

        {geoError && (
          <p className="mt-2 text-sm text-ink-mute" role="alert">
            {geoError}
          </p>
        )}
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
