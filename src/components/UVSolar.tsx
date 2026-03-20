"use client";

import type { WeatherData } from "@/types/weather";
import { CollapsibleCard } from "./CollapsibleCard";
import { Sparkline } from "@/components/ui/Sparkline";
import {
  getUVLevel,
  getSafeExposureMinutes,
  formatDuration,
  formatTime,
} from "@/lib/formatters";
import { getSolarNoon } from "@/lib/astronomy";

interface UVSolarProps {
  data: WeatherData;
}

export function UVSolar({ data }: UVSolarProps) {
  const { current, hourly, daily } = data;
  const uvLevel = getUVLevel(current.uvIndex);
  const safeMinutes = getSafeExposureMinutes(current.uvIndex);

  // Get today's UV data for chart
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const todayUVData: number[] = [];
  const todayTimes: string[] = [];

  for (let i = 0; i < hourly.time.length; i++) {
    if (hourly.time[i].startsWith(todayStr)) {
      todayUVData.push(hourly.uvIndex[i] ?? 0);
      todayTimes.push(hourly.time[i]);
    }
  }

  const solarNoon = getSolarNoon(daily.sunrise[0], daily.sunset[0]);

  return (
    <CollapsibleCard
      title="UV & Solar"
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      }
      summary={
        <span>
          UV {Math.round(current.uvIndex)} · {uvLevel.label}
        </span>
      }
    >
      <div className="space-y-4">
        {/* UV Index gauge */}
        <div className="flex items-center gap-4">
          <div
            className="sg-data text-3xl font-light"
            style={{
              color: uvLevel.color,
              textShadow: `0 0 8px ${uvLevel.color}50`,
            }}
          >
            {Math.round(current.uvIndex)}
          </div>
          <div>
            <p className="text-sm" style={{ color: uvLevel.color }}>
              {uvLevel.label}
            </p>
            {safeMinutes && (
              <p className="text-xs text-sg-text-muted">
                ~{formatDuration(safeMinutes)} safe exposure
              </p>
            )}
          </div>
        </div>

        {/* UV severity bar */}
        <div>
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
            {[
              { width: "18%", bg: "#00ff88" },
              { width: "27%", bg: "#ffb800" },
              { width: "18%", bg: "#ff8800" },
              { width: "27%", bg: "#ff3366" },
              { width: "10%", bg: "#ff00ff" },
            ].map((segment, i) => (
              <div
                key={i}
                className="h-full"
                style={{
                  width: segment.width,
                  background: segment.bg,
                  opacity:
                    current.uvIndex <=
                    [2, 5, 7, 10, 15][i]
                      ? 0.3
                      : 1,
                }}
              />
            ))}
          </div>
          <div
            className="w-2 h-2 rounded-full -mt-3 transition-all"
            style={{
              marginLeft: `${Math.min((current.uvIndex / 12) * 100, 98)}%`,
              background: uvLevel.color,
              boxShadow: `0 0 6px ${uvLevel.color}`,
            }}
          />
        </div>

        {/* UV forecast chart */}
        {todayUVData.length > 0 && (
          <div>
            <p className="text-xs text-sg-text-muted mb-2">Today&apos;s UV</p>
            <Sparkline
              data={todayUVData}
              width={280}
              height={40}
              color={uvLevel.color}
            />
            <div className="flex justify-between sg-data text-[10px] text-sg-text-muted mt-1">
              <span>12am</span>
              <span>12pm</span>
              <span>11pm</span>
            </div>
          </div>
        )}

        {/* Solar noon */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-sg-text-secondary">Solar Noon</span>
          <span className="sg-data text-sm text-sg-text-primary">
            {formatTime(solarNoon)}
          </span>
        </div>
      </div>
    </CollapsibleCard>
  );
}
