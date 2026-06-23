import type { Place } from "../types/Place";
import type { Dispatch, SetStateAction } from "react";
import { toMiles, titleCase } from "../utils";

interface PlacesProps {
  location: string;
  places: Place[];
  radius: number;
  setRadius: Dispatch<SetStateAction<number>>;
  loading?: boolean;
}

const RADII = [
  { value: "160934", label: "100 miles" },
  { value: "482803", label: "300 miles" },
  { value: "802672", label: "500 miles" },
  { value: "1609344", label: "1000 miles" },
];

export const Places = ({
  location,
  places,
  radius,
  setRadius,
  loading = false,
}: PlacesProps) => {
  return (
    <section className="panel animate-rise-in p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-herculanum text-2xl sm:text-3xl">Dark Sky Places</h2>
          <p className="mt-1 text-sm text-ink-mute">
            Certified dark-sky spots near {titleCase(location)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <label htmlFor="radius" className="whitespace-nowrap text-sm font-semibold text-ink-soft">
            Within
          </label>
          <select
            id="radius"
            onChange={(e) => setRadius(Number(e.target.value))}
            defaultValue={radius}
            className="select w-auto min-w-[8rem]"
          >
            {RADII.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <>
            <span className="sr-only">Loading places…</span>
            <ul aria-hidden="true" className="divide-y divide-white/10">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-4">
                  <div className="w-full space-y-2">
                    <div className="skel h-4 w-2/5" />
                    <div className="skel h-3 w-1/4" />
                  </div>
                  <div className="skel h-4 w-20 shrink-0" />
                </li>
              ))}
            </ul>
          </>
        ) : places.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-ink-soft">No places found within this radius.</p>
            <p className="mt-1 text-sm text-ink-mute">Try widening your search above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {places.map((place) => (
              <li
                key={place.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{place.place_name}</p>
                  <p className="mt-0.5 text-sm text-ink-mute">{place.category}</p>
                </div>
                <p className="shrink-0 whitespace-nowrap text-sm font-medium tabular-nums text-moon">
                  {place.distance !== undefined
                    ? `${toMiles(place.distance, "m")} miles away`
                    : "Distance unknown"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
