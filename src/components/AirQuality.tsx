"use client";

import type { WeatherData } from "@/types/weather";
import { CollapsibleCard } from "./CollapsibleCard";
import { ArcGauge } from "@/components/ui/ArcGauge";
import { getAQILevel } from "@/lib/formatters";

interface AirQualityProps {
  data: WeatherData;
}

export function AirQuality({ data }: AirQualityProps) {
  const { airQuality } = data;

  if (!airQuality || !airQuality.usAqi.length) return null;

  // Get current values (first entry)
  const currentAqi = airQuality.usAqi[0] ?? 0;
  const currentPm25 = airQuality.pm2_5[0] ?? 0;
  const currentPm10 = airQuality.pm10[0] ?? 0;

  const aqiLevel = getAQILevel(currentAqi);

  // Determine dominant pollutant
  const dominant = currentPm25 > currentPm10 ? "PM2.5" : "PM10";

  return (
    <CollapsibleCard
      title="Air Quality"
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 9h8M7 6h4M6 12h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        </svg>
      }
      summary={
        <span style={{ color: aqiLevel.color }}>
          AQI {currentAqi} · {aqiLevel.label}
        </span>
      }
    >
      <div className="space-y-4">
        {/* AQI Gauge */}
        <div className="flex justify-center">
          <ArcGauge
            value={currentAqi}
            max={300}
            label={aqiLevel.label}
            color={aqiLevel.color}
            size={120}
          />
        </div>

        {/* Pollutant levels */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-sg-text-muted">PM2.5</p>
            <p className="sg-data text-lg text-sg-text-primary">
              {currentPm25.toFixed(1)}
            </p>
            <p className="text-[10px] text-sg-text-muted">µg/m³</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-sg-text-muted">PM10</p>
            <p className="sg-data text-lg text-sg-text-primary">
              {currentPm10.toFixed(1)}
            </p>
            <p className="text-[10px] text-sg-text-muted">µg/m³</p>
          </div>
        </div>

        {/* Dominant pollutant */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-sg-text-secondary">
            Dominant Pollutant
          </span>
          <span className="sg-data text-xs text-sg-text-primary">
            {dominant}
          </span>
        </div>
      </div>
    </CollapsibleCard>
  );
}
