import type { VisualCrossing } from "../types/";
import { formatTime, toMiles } from "../utils";

interface ConditionsProps {
  data: VisualCrossing;
}

export const Conditions = ({ data }: ConditionsProps) => {
  const cc = data.currentConditions;
  const sunset = formatTime(cc.sunset);
  const visibility = toMiles(cc.visibility, "km");

  return (
    <section className="panel animate-rise-in p-6 sm:p-8">
      <h2 className="font-herculanum text-2xl sm:text-3xl">Conditions</h2>
      <p className="mt-3 max-w-[60ch] leading-relaxed text-ink-soft">{data.description}</p>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
        <div>
          <dt className="stat-label">Cloud cover</dt>
          <dd className="stat-value mt-1.5">{cc.cloudcover}%</dd>
          <div className="meter mt-2.5" aria-hidden="true">
            <span style={{ width: `${Math.min(100, Math.max(0, cc.cloudcover))}%` }} />
          </div>
        </div>
        <div>
          <dt className="stat-label">Precipitation</dt>
          <dd className="stat-value mt-1.5">{cc.precipprob}%</dd>
        </div>
        <div>
          <dt className="stat-label">Visibility</dt>
          <dd className="stat-value mt-1.5">{visibility} miles</dd>
        </div>
        <div>
          <dt className="stat-label">Sunset</dt>
          <dd className="stat-value mt-1.5">{sunset}</dd>
        </div>
      </dl>
    </section>
  );
};
