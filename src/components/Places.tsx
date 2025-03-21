import { useState } from "react";

export const Places = ({ location }: { location: string }) => {
  const [selectedMiles, setSelectedMiles] = useState("100");
  console.log(selectedMiles);

  return (
    <>
      <h2>Dark Sky Places</h2>
      <p>
        Within{" "}
        <span>
          <select
            onChange={(e) => setSelectedMiles(e.target.value)}
            defaultValue={50}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
          </select>
        </span>{" "}
        miles of <span>{location}</span>
      </p>

      <div className="places">
        {/* {nearbyPlaces.map((place, index) => (
          <>
            <div key={index} className="place">
              <p>{place.placeName}</p>
              <p>{place.category}</p>
              <p>{`${Math.floor(place.distance)} miles away`}</p>
            </div>
            <hr />
          </>
        ))} */}
      </div>
    </>
  );
};
