"use client";

import type { WeatherData } from "@/types/weather";
import { CollapsibleCard } from "./CollapsibleCard";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { Sparkline } from "@/components/ui/Sparkline";
import { formatTemp, formatTimeShort, formatPercent } from "@/lib/formatters";

interface HourlyForecastProps {
  data: WeatherData;
}

export function HourlyForecast({ data }: HourlyForecastProps) {
  const { hourly } = data;
  const now = new Date();

  // Find current hour index and get next 24 hours
  const currentIdx = hourly.time.findIndex(
    (t) => new Date(t) >= now
  );
  const startIdx = Math.max(0, currentIdx);
  const endIdx = Math.min(startIdx + 24, hourly.time.length);

  const hours = hourly.time.slice(startIdx, endIdx);
  const temps = hourly.temperature.slice(startIdx, endIdx);
  const codes = hourly.weatherCode.slice(startIdx, endIdx);
  const precip = hourly.precipitationProbability.slice(startIdx, endIdx);
  const winds = hourly.windSpeed.slice(startIdx, endIdx);
  const isDay = hourly.isDay.slice(startIdx, endIdx);

  const summaryTemp = temps[0] !== undefined ? formatTemp(temps[0]) : "--";
  const maxPrecip = Math.max(...precip);

  return (
    <CollapsibleCard
      title="Hourly Forecast"
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 5v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
      summary={
        <span>
          Now {summaryTemp} · {maxPrecip > 0 ? `Up to ${formatPercent(maxPrecip)} rain` : "No rain expected"}
        </span>
      }
    >
      {/* Temperature sparkline */}
      <div className="mb-3">
        <Sparkline data={temps} width={320} height={40} color="#00fff2" />
        <div className="flex justify-between sg-data text-[10px] text-sg-text-muted mt-1">
          <span>{formatTemp(Math.min(...temps))}</span>
          <span>{formatTemp(Math.max(...temps))}</span>
        </div>
      </div>

      {/* Scrollable hourly items */}
      <div className="sg-scroll-x -mx-4 px-4">
        <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
          {hours.map((time, i) => (
            <div
              key={time}
              className="flex flex-col items-center gap-1.5 min-w-[52px]"
            >
              <span className="sg-data text-[10px] text-sg-text-muted">
                {i === 0 ? "Now" : formatTimeShort(time)}
              </span>
              <WeatherIcon
                code={codes[i]}
                isDay={isDay[i] === 1}
                size={24}
              />
              <span className="sg-data text-xs text-sg-text-primary">
                {formatTemp(temps[i])}
              </span>
              {precip[i] > 0 && (
                <span className="sg-data text-[10px] text-sg-blue">
                  {formatPercent(precip[i])}
                </span>
              )}
              <span className="sg-data text-[10px] text-sg-text-muted">
                {Math.round(winds[i])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-[10px] text-sg-text-muted">
        <span>Temp °C</span>
        <span className="text-sg-blue">Rain %</span>
        <span>Wind km/h</span>
      </div>
    </CollapsibleCard>
  );
}
