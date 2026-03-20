"use client";

import type { WeatherData } from "@/types/weather";
import { CollapsibleCard } from "./CollapsibleCard";
import { formatTemp } from "@/lib/formatters";

interface FeelsLikeProps {
  data: WeatherData;
}

export function FeelsLike({ data }: FeelsLikeProps) {
  const { current } = data;
  const diff = current.apparentTemperature - current.temperature;

  // Wind chill estimate (simplified)
  const windChill =
    current.temperature < 10 && current.windSpeed > 4.8
      ? 13.12 +
        0.6215 * current.temperature -
        11.37 * Math.pow(current.windSpeed, 0.16) +
        0.3965 * current.temperature * Math.pow(current.windSpeed, 0.16)
      : current.temperature;

  // Heat index estimate (simplified Steadman formula)
  const heatIndex =
    current.temperature > 27
      ? -8.784695 +
        1.61139411 * current.temperature +
        2.338549 * current.humidity -
        0.14611605 * current.temperature * current.humidity -
        0.012308094 * current.temperature ** 2 -
        0.016424828 * current.humidity ** 2 +
        0.002211732 * current.temperature ** 2 * current.humidity +
        0.00072546 * current.temperature * current.humidity ** 2 -
        0.000003582 * current.temperature ** 2 * current.humidity ** 2
      : current.temperature;

  // Comfort level
  const comfort = getComfortLevel(current.apparentTemperature, current.humidity);

  return (
    <CollapsibleCard
      title="Feels Like Deep Dive"
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="7" y="2" width="4" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="9" cy="14" r="3" stroke="currentColor" strokeWidth="1.2" />
          <line x1="9" y1="6" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      }
      summary={
        <span>
          Feels {formatTemp(current.apparentTemperature)} ·{" "}
          {diff > 0 ? "Warmer" : diff < 0 ? "Cooler" : "Same"} than actual
        </span>
      }
    >
      <div className="space-y-4">
        {/* Main comparison */}
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-xs text-sg-text-muted">Actual</p>
            <p className="sg-data text-2xl text-sg-text-primary">
              {formatTemp(current.temperature)}
            </p>
          </div>
          <div className="text-sg-text-muted">→</div>
          <div className="text-center">
            <p className="text-xs text-sg-text-muted">Feels Like</p>
            <p
              className="sg-data text-2xl"
              style={{
                color:
                  diff > 2
                    ? "#ff3366"
                    : diff < -2
                    ? "#4d7cff"
                    : "#e8e8f0",
              }}
            >
              {formatTemp(current.apparentTemperature)}
            </p>
          </div>
        </div>

        {/* Factors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sg-text-secondary">Wind Chill</span>
            <span className="sg-data text-sm text-sg-text-primary">
              {formatTemp(windChill)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-sg-text-secondary">Heat Index</span>
            <span className="sg-data text-sm text-sg-text-primary">
              {formatTemp(heatIndex)}
            </span>
          </div>
        </div>

        {/* Comfort level */}
        <div>
          <p className="text-xs text-sg-text-muted mb-2">Comfort Level</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${comfort.level}%`,
                  background: comfort.color,
                  filter: `drop-shadow(0 0 3px ${comfort.color})`,
                }}
              />
            </div>
            <span
              className="text-xs sg-data"
              style={{ color: comfort.color }}
            >
              {comfort.label}
            </span>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}

function getComfortLevel(
  feelsLike: number,
  humidity: number
): { level: number; label: string; color: string } {
  // Comfort scoring based on apparent temperature and humidity
  let score: number;

  if (feelsLike >= 18 && feelsLike <= 24 && humidity < 70) {
    score = 90;
  } else if (feelsLike >= 15 && feelsLike <= 28) {
    score = 70;
  } else if (feelsLike >= 10 && feelsLike <= 32) {
    score = 50;
  } else if (feelsLike >= 5 && feelsLike <= 35) {
    score = 30;
  } else {
    score = 15;
  }

  // Humidity penalty
  if (humidity > 80) score -= 15;
  else if (humidity > 70) score -= 5;

  score = Math.max(5, Math.min(100, score));

  if (score >= 75) return { level: score, label: "Comfortable", color: "#00ff88" };
  if (score >= 50) return { level: score, label: "Moderate", color: "#ffb800" };
  if (score >= 30) return { level: score, label: "Uncomfortable", color: "#ff8800" };
  return { level: score, label: "Poor", color: "#ff3366" };
}
