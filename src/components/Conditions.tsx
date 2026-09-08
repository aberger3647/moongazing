import type { VisualCrossing } from "../types/";
import { useState } from "react";
import { buildSevenDayForecast, formatTime, toMiles } from "../utils";
import type { MoonOpportunity } from "../utils/buildSevenDayForecast";

interface ConditionsProps {
  data: VisualCrossing;
}

export const Conditions = ({ data }: ConditionsProps) => {
  const [view, setView] = useState<"current" | "forecast">("current");
  const cc = data.currentConditions;
  const sunset = formatTime(cc.sunset);
  const visibility = toMiles(cc.visibility, "km");
  const forecast = buildSevenDayForecast(data.days);
  const opportunityStatement =
    forecast.opportunities.length === 0
      ? "No clear full or new moon night is forecast in the next 7 days."
      : forecast.opportunities
          .map((opportunity: MoonOpportunity) =>
            `Clear skies are forecast for the ${opportunity.kind} moon on ${opportunity.day.date}.`,
          )
          .join(" ");

  return (
    <section className="panel animate-rise-in p-6 sm:p-8">
      <h2 className="font-herculanum text-2xl sm:text-3xl text-center">Conditions</h2>
      <p className="mt-3 max-w-[60ch] leading-relaxed text-ink-soft">{data.description}</p>
      <p className="mt-3 max-w-[60ch] leading-relaxed text-ink-soft">
        {opportunityStatement}
      </p>

      <div
        className="mt-6 flex justify-center gap-2"
        role="group"
        aria-label="Conditions view"
      >
        <button
          type="button"
          className={`btn px-4 py-2 text-sm ${view === "current" ? "btn-primary" : "btn-ghost"}`}
          aria-pressed={view === "current"}
          onClick={() => setView("current")}
        >
          Current
        </button>
        <button
          type="button"
          className={`btn px-4 py-2 text-sm ${view === "forecast" ? "btn-primary" : "btn-ghost"}`}
          aria-pressed={view === "forecast"}
          onClick={() => setView("forecast")}
        >
          7-day forecast
        </button>
      </div>

      {view === "current" ? (
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          <div>
            <dt className="stat-label">Cloud cover</dt>
            <dd className="stat-value mt-1.5">{cc.cloudcover}%</dd>
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
      ) : (
        <ol className="mt-6 divide-y divide-[var(--hairline)]" aria-label="7-day forecast">
          {forecast.days.map((day) => (
            <li key={day.date} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-semibold text-ink">{day.date}</h3>
                <p className="text-sm text-ink-soft">{day.condition}</p>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4 sm:gap-y-3">
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <dt className="stat-label">Cloud cover</dt>
                  <dd className="text-sm font-semibold text-ink sm:mt-1">{day.cloudCover}%</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <dt className="stat-label">Precipitation</dt>
                  <dd className="text-sm font-semibold text-ink sm:mt-1">
                    {day.precipitationChance}%
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <dt className="stat-label">Visibility</dt>
                  <dd className="text-sm font-semibold text-ink sm:mt-1">
                    {day.visibilityMiles} miles
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <dt className="stat-label">Sunset</dt>
                  <dd className="text-sm font-semibold text-ink sm:mt-1">{day.sunset}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
