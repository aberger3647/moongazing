import type { VisualCrossing } from "../types/";

interface ConditionsProps {
  data: VisualCrossing;
}

export const Conditions = ({ data }: ConditionsProps) => {
  return (
    <>
      <h2 className="font-herculanum text-3xl mb-5">Conditions</h2>

<div className="space-y-4 flex flex-col items-center mb-6">
      <p className="text-center text-lg">{data.description}</p>
      <p className="font-thin">Sunset: {data.currentConditions.sunset}</p>
      <p className="font-thin">Cloud Cover: {data.currentConditions.cloudcover}%</p>
      <p className="font-thin">Visibility: {data.currentConditions.visibility} km</p>
      <p className="font-thin">Precipitation: {data.currentConditions.precipprob}%</p>
</div>
    </>
  );
};
