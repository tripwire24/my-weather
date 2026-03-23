"use client";

import type { WeatherData } from "@/types/weather";
import { CollapsibleCard } from "./CollapsibleCard";
import { SunArc } from "@/components/ui/SunArc";
import { MoonPhaseIcon } from "@/components/ui/MoonPhaseIcon";
import { formatTime } from "@/lib/formatters";
import {
  getMoonPhase,
  getNextMoonPhaseDate,
  getMoonTimes,
  getGoldenBlueHours,
  getDayLength,
  formatDayLength,
  getSolarNoon,
} from "@/lib/astronomy";

interface SunMoonProps {
  data: WeatherData;
}

export function SunMoon({ data }: SunMoonProps) {
  const { daily, location } = data;
  const sunrise = daily.sunrise[0];
  const sunset = daily.sunset[0];
  const now = new Date();

  const dayLengthToday = getDayLength(sunrise, sunset);
  // Compare today vs tomorrow to show whether days are getting longer or shorter
  const dayLengthTomorrow =
    daily.sunrise.length > 1
      ? getDayLength(daily.sunrise[1], daily.sunset[1])
      : dayLengthToday;
  const dayLengthDiff = dayLengthTomorrow - dayLengthToday;

  const moonData = getMoonPhase(now);
  const nextFull = getNextMoonPhaseDate("full", now);
  const nextNew = getNextMoonPhaseDate("new", now);
  const moonTimes = getMoonTimes(now, location.coordinates.latitude);
  const goldenBlue = getGoldenBlueHours(sunrise, sunset);
  const solarNoon = getSolarNoon(sunrise, sunset);

  return (
    <CollapsibleCard
      title="Sun & Moon"
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="7" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14 4a6 6 0 0 0 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
      summary={
        <span>
          ☀ {formatTime(sunrise)} – {formatTime(sunset)} · {moonData.name}
        </span>
      }
      glowColor="amber"
    >
      <div className="space-y-5">
        {/* Sun arc */}
        <div>
          <h4 className="text-xs text-sg-text-muted mb-2">Sun Position</h4>
          <div className="flex justify-center">
            <SunArc
              sunrise={sunrise}
              sunset={sunset}
              currentTime={now}
              width={280}
              height={90}
            />
          </div>
        </div>

        {/* Day length */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-sg-text-muted">Day Length</p>
            <p className="sg-data text-sm text-sg-text-primary">
              {formatDayLength(dayLengthToday)}
            </p>
            <p className="text-xs text-sg-text-muted">
              {dayLengthDiff > 0
                ? `${dayLengthDiff}m longer tomorrow`
                : dayLengthDiff < 0
                ? `${Math.abs(dayLengthDiff)}m shorter tomorrow`
                : "Same length tomorrow"}
            </p>
          </div>
          <div>
            <p className="text-xs text-sg-text-muted">Solar Noon</p>
            <p className="sg-data text-sm text-sg-text-primary">
              {formatTime(solarNoon)}
            </p>
          </div>
        </div>

        {/* Golden & Blue hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-sg-amber mb-1">Golden Hour</p>
            <p className="sg-data text-xs text-sg-text-secondary">
              AM: {formatTime(goldenBlue.goldenHourMorning.start)}–
              {formatTime(goldenBlue.goldenHourMorning.end)}
            </p>
            <p className="sg-data text-xs text-sg-text-secondary">
              PM: {formatTime(goldenBlue.goldenHourEvening.start)}–
              {formatTime(goldenBlue.goldenHourEvening.end)}
            </p>
          </div>
          <div>
            <p className="text-xs text-sg-blue mb-1">Blue Hour</p>
            <p className="sg-data text-xs text-sg-text-secondary">
              AM: {formatTime(goldenBlue.blueHourMorning.start)}–
              {formatTime(goldenBlue.blueHourMorning.end)}
            </p>
            <p className="sg-data text-xs text-sg-text-secondary">
              PM: {formatTime(goldenBlue.blueHourEvening.start)}–
              {formatTime(goldenBlue.blueHourEvening.end)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5" />

        {/* Moon section */}
        <div className="flex items-center gap-4">
          <MoonPhaseIcon phase={moonData.phase} size={56} />
          <div>
            <p className="text-sm text-sg-text-primary">{moonData.name}</p>
            <p className="sg-data text-xs text-sg-text-secondary">
              {moonData.illumination}% illuminated
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-sg-text-muted">Moonrise</p>
            <p className="sg-data text-sm text-sg-text-primary">
              {formatTime(moonTimes.moonrise)}
            </p>
          </div>
          <div>
            <p className="text-xs text-sg-text-muted">Moonset</p>
            <p className="sg-data text-sm text-sg-text-primary">
              {formatTime(moonTimes.moonset)}
            </p>
          </div>
          <div>
            <p className="text-xs text-sg-text-muted">Next Full Moon</p>
            <p className="sg-data text-xs text-sg-text-secondary">
              {nextFull.toLocaleDateString("en-NZ", {
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-sg-text-muted">Next New Moon</p>
            <p className="sg-data text-xs text-sg-text-secondary">
              {nextNew.toLocaleDateString("en-NZ", {
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}
