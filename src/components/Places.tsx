import type { Place } from "../types/Place";
import type { Dispatch, SetStateAction } from "react";

interface PlacesProps {
  location: string;
  places: Place[];
  radius: number;
  setRadius: Dispatch<SetStateAction<number>>;
}

export const Places = ({ location, places, radius, setRadius }: PlacesProps) => {
  return (
    <>
      <h2>Dark Sky Places</h2>
     <p>
        Within{" "}
        <span>
           <select
            onChange={(e) => setRadius(Number(e.target.value))}
            defaultValue={radius}
          >
            <option value="160934">100</option>
            <option value="482803">300</option>
            <option value="802672">500</option>
            <option value="1609344">1000</option>
          </select>
        </span>{" "}
        miles of <span>{location}</span>
      </p> 

    <div className="places">
  {places.length === 0 ? (
    <p>No places found within this radius.</p>
  ) : (
    places.map((place) => (
      <div className="place-wrapper" key={place.id}>
        <div className="place">
          <p>{place.place_name}</p>
          <p>{place.category}</p>
          <p>
            {place.distance !== undefined
              ? `${Math.floor(place.distance)} m away`
              : "Distance unknown"}
          </p>
        </div>
        <hr />
      </div>
    ))
  )}
</div>

    </>
  );
};
