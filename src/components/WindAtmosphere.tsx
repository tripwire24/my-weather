"use client";

import type { WeatherData } from "@/types/weather";
import { CollapsibleCard } from "./CollapsibleCard";
import { CompassRose } from "@/components/ui/CompassRose";
import { ArcGauge } from "@/components/ui/ArcGauge";
import {
  formatWind,
  formatPressure,
  formatVisibility,
  formatTemp,
  getWindDirection,
  getPressureTrend,
} from "@/lib/formatters";

interface WindAtmosphereProps {
  data: WeatherData;
}

export function WindAtmosphere({ data }: WindAtmosphereProps) {
  const { current, hourly } = data;
  const windDir = getWindDirection(current.windDirection);
  const pressureTrend = getPressureTrend(
    current.pressure,
    hourly.pressure,
    hourly.time
  );

  const trendArrow =
    pressureTrend === "rising" ? "↑" : pressureTrend === "falling" ? "↓" : "→";
  const trendColor =
    pressureTrend === "rising"
      ? "#00ff88"
      : pressureTrend === "falling"
      ? "#ff3366"
      : "#8888aa";

  return (
    <CollapsibleCard
      title="Wind & Atmosphere"
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 9h10c2 0 3-1 3-2.5S14 4 12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 13h7c1.5 0 2.5-1 2.5-2s-1-2-2.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
      summary={
        <span>
          {formatWind(current.windSpeed)} {windDir} · {formatPressure(current.pressure)}
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Compass */}
        <div className="flex flex-col items-center col-span-2">
          <CompassRose
            direction={current.windDirection}
            speed={current.windSpeed}
            size={120}
          />
          <p className="text-xs text-sg-text-secondary mt-1">
            {windDir} at {formatWind(current.windSpeed)}
          </p>
          <p className="text-xs text-sg-text-muted">
            Gusts {formatWind(current.windGusts)}
          </p>
        </div>

        {/* Humidity gauge */}
        <ArcGauge
          value={current.humidity}
          max={100}
          label="Humidity"
          unit="%"
          color="#4d7cff"
          size={100}
        />

        {/* Pressure */}
        <div className="flex flex-col items-center justify-center">
          <p className="text-xs text-sg-text-muted mb-1">Pressure</p>
          <p className="sg-data text-xl text-sg-text-primary">
            {Math.round(current.pressure)}
          </p>
          <p className="text-xs text-sg-text-muted">hPa</p>
          <p className="sg-data text-sm mt-1" style={{ color: trendColor }}>
            {trendArrow} {pressureTrend}
          </p>
        </div>

        {/* Visibility */}
        <div className="flex flex-col items-center">
          <p className="text-xs text-sg-text-muted mb-1">Visibility</p>
          <p className="sg-data text-lg text-sg-text-primary">
            {formatVisibility(current.visibility)}
          </p>
        </div>

        {/* Dew point */}
        <div className="flex flex-col items-center">
          <p className="text-xs text-sg-text-muted mb-1">Dew Point</p>
          <p className="sg-data text-lg text-sg-text-primary">
            {formatTemp(current.dewPoint)}
          </p>
        </div>
      </div>
    </CollapsibleCard>
  );
}
