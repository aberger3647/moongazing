import { Conditions, Alerts, Places, Moon } from "./components";
import type { MoonPhase, VisualCrossing } from "./types";
import { getConditions, determineMoonPhase } from "./utils";
import { useState, useEffect } from "react";

export const Home = () => {
  const [data, setData] = useState<VisualCrossing | null>(null);
  const [loading, setLoading] = useState(false);
  const [moonPhase, setMoonPhase] = useState<MoonPhase>("Full Moon");
  // const [userCoords, setUserCoords] = useState("0,0");

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

  useEffect(() => {
    if (moonPhase) {
      console.log("moon phase updated:", moonPhase);
    }
  }, [moonPhase]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let location = formData.get("location");

    setLoading(true);
    try {
      const conditions = await getConditions({ location: location });

      if (conditions && conditions.resolvedAddress) {
        setData(conditions);

        // const currentCoords = `${conditions.latitude},${conditions.longitude}`;
        // setUserCoords(currentCoords);

        console.log("conditions:", conditions);
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

      <Moon size={100} phase={moonPhase} />
      <h2>{moonPhase}</h2>

      <form onSubmit={onSubmit}>
        <label htmlFor="location">Enter location</label>
        <input name="location" id="location" placeholder="city"></input>
        <button type="submit">Submit</button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : data ? (
        <>
          <h2>{data.resolvedAddress}</h2>

          <Conditions data={data} />
          <Places location={data.resolvedAddress} />
          <Alerts location={data.resolvedAddress} />
        </>
      ) : null}
    </main>
  );
};
