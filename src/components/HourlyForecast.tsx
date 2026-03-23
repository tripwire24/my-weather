'use client';

import { WeatherIcon } from '@/components/ui/WeatherIcon';
import { Sparkline } from '@/components/ui/Sparkline';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import { formatTemp, formatHourLabel, formatWindSpeed, formatPercent } from '@/lib/formatters';
import type { HourlyForecast as HourlyForecastType } from '@/types/weather';

interface HourlyForecastProps {
  hourly: HourlyForecastType[];
}

export function HourlyForecast({ hourly }: HourlyForecastProps) {
  // Show next 24 hours from now
  const now = new Date();
  const upcoming = hourly
    .filter(h => new Date(h.time) >= new Date(now.getTime() - 30 * 60 * 1000))
    .slice(0, 25);

  const temps = upcoming.map(h => h.temperature);
  const currentIndex = upcoming.findIndex(h =>
    Math.abs(new Date(h.time).getTime() - now.getTime()) < 1800000
  );

  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  const summary = upcoming.length > 0
    ? `${formatTemp(upcoming[0].temperature)} → ${formatTemp(upcoming[Math.min(12, upcoming.length - 1)].temperature)} · ${formatTemp(maxTemp)} high`
    : 'No data';

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8h12M2 8l3-3M2 8l3 3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <CollapsibleCard
      title="Hourly Forecast"
      summary={summary}
      accentColor="cyan"
      icon={icon}
    >
      {/* Sparkline */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="sg-label">TEMPERATURE — NEXT 24H</span>
          <span className="sg-mono text-xs text-[var(--sg-text-muted)]">
            {formatTemp(minTemp)} – {formatTemp(maxTemp)}
          </span>
        </div>
        <div className="w-full overflow-hidden rounded">
          <Sparkline
            data={temps}
            width={Math.max(320, upcoming.length * 28)}
            height={48}
            color="#5ce0d6"
            fillColor="#5ce0d6"
            highlightIndex={currentIndex}
            showDots={false}
          />
        </div>
      </div>

      {/* Hourly cards */}
      <div className="sg-scroll-x flex gap-2 pb-1">
        {upcoming.map((h, i) => {
          const isNow = i === currentIndex;
          return (
            <HourlyCell key={h.time} hour={h} isNow={isNow} />
          );
        })}
      </div>
    </CollapsibleCard>
  );
}

function HourlyCell({ hour, isNow }: { hour: HourlyForecastType; isNow: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-1 flex-shrink-0 px-2.5 py-2 rounded-lg transition-all"
      style={{
        minWidth: '58px',
        background: isNow ? 'rgba(92, 224, 214,0.1)' : 'rgba(92, 224, 214,0.03)',
        border: `1px solid ${isNow ? 'rgba(92, 224, 214,0.4)' : 'rgba(92, 224, 214,0.1)'}`,
        boxShadow: isNow ? '0 0 12px rgba(92, 224, 214,0.15)' : 'none',
      }}
    >
      {/* Time */}
      <span className="sg-mono text-[10px] text-[var(--sg-text-muted)]">
        {isNow ? 'Now' : formatHourLabel(hour.time)}
      </span>

      {/* Icon */}
      <WeatherIcon code={hour.weatherCode} isDay={hour.isDay} size={22} color={isNow ? '#5ce0d6' : '#6b8cff'} />

      {/* Temperature */}
      <span
        className="sg-mono text-xs font-semibold"
        style={{ color: isNow ? 'var(--sg-cyan)' : 'var(--sg-text-primary)' }}
      >
        {formatTemp(hour.temperature, false)}
      </span>

      {/* Precip prob */}
      {hour.precipitationProbability > 5 && (
        <div className="flex items-center gap-0.5">
          <RainDrop size={8} color={hour.precipitationProbability > 60 ? '#5ce0d6' : '#3a5570'} />
          <span className="sg-mono text-[9px]" style={{ color: hour.precipitationProbability > 60 ? 'var(--sg-cyan)' : 'var(--sg-text-muted)' }}>
            {hour.precipitationProbability}%
          </span>
        </div>
      )}

      {/* Wind */}
      <span className="sg-mono text-[9px] text-[var(--sg-text-muted)]">
        {Math.round(hour.windSpeed)}
      </span>
    </div>
  );
}

function RainDrop({ size = 10, color = '#5ce0d6' }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 10 12" fill="none">
      <path d="M5 1 C3 4, 1 6, 1 8 A4 4 0 0 0 9 8 C9 6 7 4 5 1 Z"
        fill={color} opacity={0.7}
      />
    </svg>
  );
}
