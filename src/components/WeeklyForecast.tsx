"use client";

import { useState } from "react";
import type { WeatherData } from "@/types/weather";
import { CollapsibleCard } from "./CollapsibleCard";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import {
  formatTemp,
  formatPercent,
  formatDayName,
  formatTimeShort,
  getWeatherDescription,
} from "@/lib/formatters";

interface WeeklyForecastProps {
  data: WeatherData;
}

export function WeeklyForecast({ data }: WeeklyForecastProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const { daily, hourly } = data;

  const todayHigh = daily.temperatureMax[0];
  const todayLow = daily.temperatureMin[0];

  return (
    <CollapsibleCard
      title="7-Day Forecast"
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 7h14" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 1v4M12 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
      summary={
        <span>
          Today {formatTemp(todayHigh)}/{formatTemp(todayLow)} ·{" "}
          {getWeatherDescription(daily.weatherCode[0])}
        </span>
      }
    >
      <div className="space-y-1">
        {daily.time.map((date, i) => {
          const isExpanded = expandedDay === i;

          // Find hourly data for this day
          const dayStart = date + "T00:00";
          const dayEnd = date + "T23:59";

          return (
            <div key={date}>
              <button
                onClick={() => setExpandedDay(isExpanded ? null : i)}
                className="w-full flex items-center gap-2 py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-xs text-sg-text-secondary w-12 text-left shrink-0">
                  {formatDayName(date)}
                </span>
                <WeatherIcon code={daily.weatherCode[i]} size={22} />
                {/* Temperature bar */}
                <div className="flex-1 flex items-center gap-2">
                  <span className="sg-data text-xs text-sg-text-muted w-8 text-right">
                    {formatTemp(daily.temperatureMin[i])}
                  </span>
                  <TemperatureBar
                    low={daily.temperatureMin[i]}
                    high={daily.temperatureMax[i]}
                    rangeMin={Math.min(...daily.temperatureMin)}
                    rangeMax={Math.max(...daily.temperatureMax)}
                  />
                  <span className="sg-data text-xs text-sg-text-primary w-8">
                    {formatTemp(daily.temperatureMax[i])}
                  </span>
                </div>
                {daily.precipitationProbabilityMax[i] > 0 && (
                  <span className="sg-data text-[10px] text-sg-blue w-8 text-right">
                    {formatPercent(daily.precipitationProbabilityMax[i])}
                  </span>
                )}
              </button>

              {/* Expanded hourly view for this day */}
              {isExpanded && (
                <div className="sg-scroll-x pl-14 pb-2 sg-fade-in">
                  <div
                    className="flex gap-3 py-2"
                    style={{ width: "max-content" }}
                  >
                    {hourly.time.map((time, hi) => {
                      if (time < dayStart || time > dayEnd) return null;
                      const hour = new Date(time).getHours();
                      if (hour % 3 !== 0) return null; // Show every 3 hours
                      return (
                        <div
                          key={time}
                          className="flex flex-col items-center gap-1 min-w-[44px]"
                        >
                          <span className="sg-data text-[10px] text-sg-text-muted">
                            {formatTimeShort(time)}
                          </span>
                          <WeatherIcon
                            code={hourly.weatherCode[hi]}
                            isDay={hourly.isDay[hi] === 1}
                            size={20}
                          />
                          <span className="sg-data text-[10px] text-sg-text-primary">
                            {formatTemp(hourly.temperature[hi])}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
}

function TemperatureBar({
  low,
  high,
  rangeMin,
  rangeMax,
}: {
  low: number;
  high: number;
  rangeMin: number;
  rangeMax: number;
}) {
  const range = rangeMax - rangeMin || 1;
  const leftPercent = ((low - rangeMin) / range) * 100;
  const widthPercent = ((high - low) / range) * 100;

  return (
    <div className="flex-1 h-1 rounded-full bg-white/5 relative overflow-hidden">
      <div
        className="absolute h-full rounded-full"
        style={{
          left: `${leftPercent}%`,
          width: `${Math.max(widthPercent, 5)}%`,
          background: `linear-gradient(90deg, #4d7cff, #00fff2, #ffb800)`,
          filter: "drop-shadow(0 0 2px rgba(0,255,242,0.4))",
        }}
      />
    </div>
  );
}
