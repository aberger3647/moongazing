import type { VisualCrossing } from "../types/";
import { formatTime, toMiles } from "../utils";

interface ConditionsProps {
  data: VisualCrossing;
}

export const Conditions = ({ data }: ConditionsProps) => {
  const formattedSunset = formatTime(data.currentConditions.sunset);
  const formattedVisibility = toMiles(data.currentConditions.visibility, "km");
  return (
    <>
      <h2 className="font-herculanum text-3xl mb-5">Conditions</h2>

<div className="space-y-4 flex flex-col items-center mb-6">
      <p className="text-center text-lg">{data.description}</p>
      <p className="font-thin">Sunset: {formattedSunset}</p>
      <p className="font-thin">Cloud Cover: {data.currentConditions.cloudcover}%</p>
      <p className="font-thin">Visibility: {formattedVisibility} miles</p>
      <p className="font-thin">Precipitation: {data.currentConditions.precipprob}%</p>
</div>
    </>
  );
};
