import { VisualCrossing } from "../types/visualcrossing";

interface ConditionsProps {
  data: VisualCrossing;
}

export const Conditions = ({ data }: ConditionsProps) => {
  return (
    <>
      <h2>Conditions</h2>

      <p>{data.description}</p>
      <p>Sunset: {data.currentConditions.sunset}</p>
      <p>Cloud Cover: {data.currentConditions.cloudcover}%</p>
      <p>Visibility: {data.currentConditions.visibility} km</p>
      <p>Precipitation: {data.currentConditions.precipprob}%</p>
    </>
  );
};
