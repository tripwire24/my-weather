"use client";

import type { WeatherData } from "@/types/weather";
import { CollapsibleCard } from "./CollapsibleCard";
import {
  getCurrentSeason,
  getSeasonalDates,
  getDayLength,
} from "@/lib/astronomy";

interface AstronomySeasonsProps {
  data: WeatherData;
}

export function AstronomySeasons({ data }: AstronomySeasonsProps) {
  const { daily } = data;
  const now = new Date();
  const year = now.getFullYear();
  const season = getCurrentSeason(now);
  const dates = getSeasonalDates(year);

  // Day length trend
  const dayLengthToday = getDayLength(daily.sunrise[0], daily.sunset[0]);
  const dayLengthTomorrow =
    daily.sunrise.length > 1
      ? getDayLength(daily.sunrise[1], daily.sunset[1])
      : dayLengthToday;
  const diff = dayLengthTomorrow - dayLengthToday;
  const daysGettingLonger = diff > 0;

  const nextEvents = [
    { label: "March Equinox", date: dates.marchEquinox },
    { label: "June Solstice", date: dates.juneSolstice },
    { label: "September Equinox", date: dates.septemberEquinox },
    { label: "December Solstice", date: dates.decemberSolstice },
  ]
    .filter((e) => e.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <CollapsibleCard
      title="Astronomy & Seasons"
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="9" cy="9" rx="7" ry="3" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <circle cx="9" cy="9" r="2" fill="currentColor" opacity="0.5" />
        </svg>
      }
      summary={
        <span>
          {season.name} · {season.daysRemaining} days remaining
        </span>
      }
      glowColor="magenta"
    >
      <div className="space-y-4">
        {/* Current season */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-sg-text-primary">{season.name}</p>
            <p className="text-xs text-sg-text-muted">
              {season.daysRemaining} days until {season.nextSeason}
            </p>
          </div>
          {/* Season progress bar */}
          <div className="w-24">
            <SeasonProgressBar
              daysRemaining={season.daysRemaining}
              totalDays={90} // approximate
            />
          </div>
        </div>

        {/* Day length trend */}
        <div>
          <p className="text-xs text-sg-text-muted mb-1">Day Length Trend</p>
          <p className="text-sm text-sg-text-primary">
            Days getting{" "}
            <span
              style={{
                color: daysGettingLonger ? "#ffb800" : "#4d7cff",
              }}
            >
              {daysGettingLonger ? "longer" : "shorter"}
            </span>
          </p>
          {diff !== 0 && (
            <p className="sg-data text-xs text-sg-text-muted">
              {Math.abs(diff)} min {daysGettingLonger ? "more" : "less"} tomorrow
            </p>
          )}
        </div>

        {/* Upcoming events */}
        <div>
          <p className="text-xs text-sg-text-muted mb-2">Upcoming Events</p>
          <div className="space-y-2">
            {nextEvents.slice(0, 3).map((event) => {
              const daysUntil = Math.ceil(
                (event.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={event.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-sg-text-secondary">
                    {event.label}
                  </span>
                  <div className="text-right">
                    <span className="sg-data text-xs text-sg-text-primary">
                      {event.date.toLocaleDateString("en-NZ", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="text-xs text-sg-text-muted ml-2">
                      {daysUntil}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}

function SeasonProgressBar({
  daysRemaining,
  totalDays,
}: {
  daysRemaining: number;
  totalDays: number;
}) {
  const progress = Math.max(0, Math.min(1, 1 - daysRemaining / totalDays));

  return (
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #ff00ff, #00fff2)",
          filter: "drop-shadow(0 0 2px rgba(255,0,255,0.4))",
        }}
      />
    </div>
  );
}
