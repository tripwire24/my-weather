'use client';

import { useState } from 'react';
import { WeatherIcon } from '@/components/ui/WeatherIcon';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import { formatTemp, formatDayName, wmoLabel, formatPercent } from '@/lib/formatters';
import type { DailyForecast } from '@/types/weather';

interface WeeklyForecastProps {
  daily: DailyForecast[];
}

export function WeeklyForecast({ daily }: WeeklyForecastProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const week = daily.slice(0, 7);

  const allTemps = week.flatMap(d => [d.tempMin, d.tempMax]);
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);

  const summary = week.length > 0
    ? `${formatTemp(week[0].tempMax)}/${formatTemp(week[0].tempMin)} · ${week.map(d => formatTemp(d.tempMax, false)).join(' ')}`
    : 'No data';

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth={1.3} />
      <path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );

  return (
    <CollapsibleCard
      title="7-Day Forecast"
      summary={summary}
      accentColor="blue"
      icon={icon}
    >
      <div className="space-y-1">
        {week.map((day, i) => (
          <DayRow
            key={day.date}
            day={day}
            index={i}
            isToday={i === 0}
            isExpanded={expandedDay === i}
            onToggle={() => setExpandedDay(expandedDay === i ? null : i)}
            globalMin={globalMin}
            globalMax={globalMax}
          />
        ))}
      </div>
    </CollapsibleCard>
  );
}

function DayRow({
  day,
  index,
  isToday,
  isExpanded,
  onToggle,
  globalMin,
  globalMax,
}: {
  day: DailyForecast;
  index: number;
  isToday: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  globalMin: number;
  globalMax: number;
}) {
  const range = globalMax - globalMin || 1;
  const lowPct = ((day.tempMin - globalMin) / range) * 100;
  const highPct = ((day.tempMax - globalMin) / range) * 100;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-2 px-1 rounded-lg active:bg-[rgba(107, 140, 255,0.08)] transition-colors"
      >
        {/* Day name */}
        <span
          className="sg-mono text-xs w-8 text-left flex-shrink-0"
          style={{ color: isToday ? 'var(--sg-cyan)' : 'var(--sg-text-secondary)' }}
        >
          {isToday ? 'Today' : formatDayName(day.date, true)}
        </span>

        {/* Icon */}
        <WeatherIcon code={day.weatherCode} isDay={true} size={20} color={isToday ? '#5ce0d6' : '#6b8cff'} />

        {/* Precip prob */}
        <span className="sg-mono text-[10px] w-8 text-center flex-shrink-0" style={{ color: day.precipitationProbability > 40 ? 'var(--sg-cyan)' : 'var(--sg-text-muted)' }}>
          {day.precipitationProbability > 5 ? `${day.precipitationProbability}%` : ''}
        </span>

        {/* Temp bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="sg-mono text-xs text-[var(--sg-text-muted)] w-10 text-right flex-shrink-0">
            {formatTemp(day.tempMin, false)}
          </span>

          {/* Bar track */}
          <div className="flex-1 h-1.5 rounded-full relative" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="absolute h-full rounded-full"
              style={{
                left: `${lowPct}%`,
                width: `${highPct - lowPct}%`,
                background: isToday
                  ? 'linear-gradient(90deg, #6b8cff, #5ce0d6)'
                  : 'linear-gradient(90deg, #3a5570, #7a9bbf)',
                boxShadow: isToday ? '0 0 6px rgba(92, 224, 214,0.4)' : 'none',
              }}
            />
          </div>

          <span className="sg-mono text-xs text-[var(--sg-text-primary)] w-10 flex-shrink-0">
            {formatTemp(day.tempMax, false)}
          </span>
        </div>

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{
            color: 'var(--sg-text-muted)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.25s ease',
            flexShrink: 0,
          }}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded day detail */}
      {isExpanded && (
        <div
          className="mx-1 mb-2 p-3 rounded-lg sg-animate-fade-in"
          style={{
            background: 'rgba(107, 140, 255,0.06)',
            border: '1px solid rgba(107, 140, 255,0.15)',
          }}
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            <StatItem label="CONDITIONS" value={wmoLabel(day.weatherCode)} small />
            <StatItem label="PRECIP" value={`${day.precipitation.toFixed(1)}mm`} />
            <StatItem label="RAIN PROB" value={`${day.precipitationProbability}%`} />
            <StatItem label="WIND MAX" value={`${Math.round(day.windSpeedMax)} km/h`} />
            <StatItem label="GUSTS" value={`${Math.round(day.windGustsMax)} km/h`} />
            <StatItem label="UV MAX" value={`${Math.round(day.uvIndexMax)}`} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div className="sg-label mb-0.5">{label}</div>
      <div className={`sg-mono text-[var(--sg-text-primary)] ${small ? 'text-[10px]' : 'text-xs'}`}>
        {value}
      </div>
    </div>
  );
}
