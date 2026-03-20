"use client";

import type { WeatherData } from "@/types/weather";
import { CollapsibleCard } from "./CollapsibleCard";
import { formatPercent } from "@/lib/formatters";

interface PrecipitationStormsProps {
  data: WeatherData;
}

export function PrecipitationStorms({ data }: PrecipitationStormsProps) {
  const { current, hourly, daily } = data;
  const now = new Date();

  // Find current hour index
  const currentIdx = hourly.time.findIndex((t) => new Date(t) >= now);

  // Precipitation probabilities for next 1h, 6h, 12h
  const precipProbs = {
    "1h": getMaxInRange(hourly.precipitationProbability, currentIdx, currentIdx + 1),
    "6h": getMaxInRange(hourly.precipitationProbability, currentIdx, currentIdx + 6),
    "12h": getMaxInRange(hourly.precipitationProbability, currentIdx, currentIdx + 12),
  };

  const totalPrecipToday = daily.precipitationSum[0] ?? 0;
  const isThunderstorm = current.weatherCode >= 95;

  const precipType = getPrecipType(current.weatherCode);
  const intensity = getPrecipIntensity(current.precipitation);

  return (
    <CollapsibleCard
      title="Precipitation & Storms"
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 10h10c2 0 3-1.5 3-3s-1.5-3-3-3h-.5C13 2 11 .5 8.5.5S4 2 3.5 4H3c-2 0-3 1.5-3 3s1.5 3 3 3z" stroke="currentColor" strokeWidth="1.2" transform="translate(1, 1)" />
          <path d="M6 13l-1 4M10 13l-1 4M14 13l-1 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
      summary={
        <span>
          {current.precipitation > 0
            ? `${current.precipitation} mm ${precipType}`
            : `${formatPercent(precipProbs["1h"])} chance next hour`}
        </span>
      }
      glowColor="blue"
    >
      <div className="space-y-4">
        {/* Current precipitation */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-sg-text-secondary">Current</span>
          <div className="text-right">
            <span className="sg-data text-sm text-sg-text-primary">
              {current.precipitation > 0
                ? `${current.precipitation} mm/h`
                : "None"}
            </span>
            {current.precipitation > 0 && (
              <p className="text-xs text-sg-text-muted">
                {precipType} · {intensity}
              </p>
            )}
          </div>
        </div>

        {/* Probability bars */}
        <div className="space-y-2">
          <p className="text-xs text-sg-text-muted">Probability of rain</p>
          {(["1h", "6h", "12h"] as const).map((period) => (
            <div key={period} className="flex items-center gap-3">
              <span className="sg-data text-xs text-sg-text-muted w-8">
                {period}
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${precipProbs[period]}%`,
                    background:
                      precipProbs[period] > 60
                        ? "#4d7cff"
                        : precipProbs[period] > 30
                        ? "rgba(77,124,255,0.6)"
                        : "rgba(77,124,255,0.3)",
                    filter:
                      precipProbs[period] > 40
                        ? "drop-shadow(0 0 3px rgba(77,124,255,0.5))"
                        : "none",
                  }}
                />
              </div>
              <span className="sg-data text-xs text-sg-text-primary w-10 text-right">
                {formatPercent(precipProbs[period])}
              </span>
            </div>
          ))}
        </div>

        {/* Total today */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-sg-text-secondary">Total today</span>
          <span className="sg-data text-sm text-sg-text-primary">
            {totalPrecipToday.toFixed(1)} mm
          </span>
        </div>

        {/* Thunderstorm indicator */}
        {isThunderstorm && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,184,0,0.1)",
              border: "1px solid rgba(255,184,0,0.3)",
            }}
          >
            <span className="text-sg-amber">⚡</span>
            <span className="text-xs text-sg-amber">
              Thunderstorm activity detected
            </span>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}

function getMaxInRange(arr: number[], start: number, end: number): number {
  const slice = arr.slice(
    Math.max(0, start),
    Math.min(arr.length, end)
  );
  return slice.length ? Math.max(...slice) : 0;
}

function getPrecipType(code: number): string {
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 85 && code <= 86) return "Snow";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 66 && code <= 67) return "Freezing rain";
  return "Rain";
}

function getPrecipIntensity(mm: number): string {
  if (mm <= 0) return "None";
  if (mm < 0.5) return "Light";
  if (mm < 4) return "Moderate";
  if (mm < 8) return "Heavy";
  return "Intense";
}
