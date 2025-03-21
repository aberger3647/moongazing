import { Conditions, Alerts, Places } from "./components";
import { getConditions, determineMoonPhase, convertToCamelCase } from "./utils";
import { useState } from "react";
import { VisualCrossing } from "./types/visualcrossing"

export const Home = () => {
  const [data, setData] = useState<VisualCrossing | null>(null);
  const [loading, setLoading] = useState(false);
  const [moonPhase, setMoonPhase] = useState("");
  // const [userCoords, setUserCoords] = useState("0,0");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let location = formData.get("location");

    try {
      setLoading(true);
      const conditions = await getConditions(location);

      if (conditions && conditions.resolvedAddress) {
        setData(conditions);

        // const currentCoords = `${conditions.latitude},${conditions.longitude}`;
        // setUserCoords(currentCoords);

        const currentMoonPhase = conditions.days[0].moonphase;
        setMoonPhase(determineMoonPhase(currentMoonPhase));
        console.log(data)
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Moongaz.ing</h1>

      <form onSubmit={onSubmit}>
        <label htmlFor="location">Enter location</label>
        <input name="location" id="location" placeholder="city"></input>
        <button type="submit">Submit</button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : data ? (
        <>
          <img
            src={`./moon/${convertToCamelCase(moonPhase)}.svg`}
            width="200px"
            height="200px"
            alt={moonPhase}
          />
          <h2>{moonPhase}</h2>
          <h2>{data.resolvedAddress}</h2>

          <Conditions data={data} />
          <Places location={data.resolvedAddress} />
          <Alerts location={data.resolvedAddress} />
        </>
      ) : null}
    </main>
  );
};
