"use client";

import { useState, useEffect } from "react";
import type { WeatherData } from "@/types/weather";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import {
  formatTemp,
  formatRelativeTime,
  getWeatherDescription,
  getUVLevel,
} from "@/lib/formatters";

interface HeroSectionProps {
  data: WeatherData;
  isStale: boolean;
}

export function HeroSection({ data, isStale }: HeroSectionProps) {
  const { current, daily, location } = data;
  const todayHigh = daily.temperatureMax[0];
  const todayLow = daily.temperatureMin[0];
  const description = getWeatherDescription(current.weatherCode);

  // Determine most important alert
  const alert = getTopAlert(current.uvIndex, current.windGusts, current.weatherCode);

  // Avoid hydration mismatch: render time only on the client
  const [timeStr, setTimeStr] = useState("");
  useEffect(() => {
    const update = () =>
      setTimeStr(
        new Date().toLocaleTimeString("en-NZ", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="px-4 pt-6 pb-4" aria-label="Current weather summary">
      {/* Location & time row */}
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-sg-text-primary truncate">
            {location.name}
          </h1>
          {location.admin1 && (
            <p className="text-xs text-sg-text-muted">
              {location.admin1}, {location.country}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="sg-data text-xs text-sg-text-secondary">{timeStr}</p>
          <p
            className={`text-xs mt-0.5 ${
              isStale ? "text-sg-amber" : "text-sg-text-muted"
            }`}
          >
            {isStale && "⚠ "}
            {formatRelativeTime(data.fetchedAt)}
          </p>
        </div>
      </div>

      {/* Main temperature + conditions */}
      <div className="flex items-center gap-4 mb-3">
        <WeatherIcon
          code={current.weatherCode}
          isDay={current.isDay}
          size={56}
        />
        <div>
          <div className="flex items-baseline gap-1">
            <span className="sg-data-mono text-5xl font-light text-sg-text-primary sg-text-glow-cyan">
              {formatTemp(current.temperature)}
            </span>
          </div>
          <p className="text-sm text-sg-text-secondary">
            Feels like{" "}
            <span className="sg-data-mono">
              {formatTemp(current.apparentTemperature)}
            </span>
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-sg-text-secondary">
            H:{" "}
            <span className="sg-data text-sg-text-primary">
              {formatTemp(todayHigh)}
            </span>
          </p>
          <p className="text-sm text-sg-text-secondary">
            L:{" "}
            <span className="sg-data text-sg-text-primary">
              {formatTemp(todayLow)}
            </span>
          </p>
        </div>
      </div>

      {/* Condition description */}
      <p className="text-sm text-sg-text-secondary mb-2">{description}</p>

      {/* Alert banner */}
      {alert && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{
            background: `${alert.color}10`,
            border: `1px solid ${alert.color}30`,
          }}
        >
          <span style={{ color: alert.color }}>{alert.icon}</span>
          <span style={{ color: alert.color }}>{alert.message}</span>
        </div>
      )}
    </section>
  );
}

function getTopAlert(
  uvIndex: number,
  windGusts: number,
  weatherCode: number
): { icon: string; message: string; color: string } | null {
  if (weatherCode >= 95) {
    return {
      icon: "⚡",
      message: "Thunderstorm activity",
      color: "#ffb800",
    };
  }
  if (windGusts > 80) {
    return {
      icon: "💨",
      message: `Wind gusts up to ${Math.round(windGusts)} km/h`,
      color: "#ff3366",
    };
  }
  if (uvIndex >= 8) {
    const level = getUVLevel(uvIndex);
    return {
      icon: "☀",
      message: `UV ${level.label} (${Math.round(uvIndex)})`,
      color: level.color,
    };
  }
  if (weatherCode >= 65 && weatherCode <= 67) {
    return {
      icon: "🌧",
      message: "Heavy rain expected",
      color: "#4d7cff",
    };
  }
  return null;
}
