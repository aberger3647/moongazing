import type { Place } from "../types/Place";
import type { Dispatch, SetStateAction } from "react";
import { toMiles } from "../utils";

interface PlacesProps {
  location: string;
  places: Place[];
  radius: number;
  setRadius: Dispatch<SetStateAction<number>>;
}

export const Places = ({
  location,
  places,
  radius,
  setRadius,
}: PlacesProps) => {

  return (
    <>
      <h2 className="font-herculanum text-3xl mb-5">Dark Sky Places</h2>
      <p className="mb-5 text-lg text-center leading-loose">
        Within{" "}
        <span>
          <select
            onChange={(e) => setRadius(Number(e.target.value))}
            defaultValue={radius}
            className="text-indigo-950 py-2 px-3 bg-indigo-100 rounded-xl"
          >
            <option value="160934">100</option>
            <option value="482803">300</option>
            <option value="802672">500</option>
            <option value="1609344">1000</option>
          </select>
        </span>{" "}
        miles of{" "}
        <span>
          {location
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
          :
        </span>
      </p>

      <div className="places mb-6 flex flex-col items-center max-w-96">
        {places.length === 0 ? (
          <p className="text-lg font-thin">
            No places found within this radius.
          </p>
        ) : (
          places.map((place) => (
            <div className="place-wrapper m-3" key={place.id}>
              <div className="place flex flex-col space-y-2">
                <p className="text-center text-2xl font-bold">
                  {place.place_name}
                </p>
                <p className="text-center text-xl font-medium">
                  {place.category}
                </p>
                <p className="text-center text-lg font-thin">
                  {place.distance !== undefined
                    ? `${toMiles(place.distance, "m")} miles away`
                    : "Distance unknown"}
                </p>
              </div>
              <hr className="border-indigo-300 mt-4 w-24 mx-auto" />
            </div>
          ))
        )}
      </div>
    </>
  );
};
