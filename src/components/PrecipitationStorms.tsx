'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import type { CurrentWeather, HourlyForecast } from '@/types/weather';
import { formatPrecip } from '@/lib/formatters';

interface PrecipitationStormsProps {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  dailyPrecipTotal: number;
}

export function PrecipitationStorms({ current, hourly, dailyPrecipTotal }: PrecipitationStormsProps) {
  const now = new Date();

  const getAvgPrecipProb = (hoursAhead: number) => {
    const future = hourly.filter(h => {
      const t = new Date(h.time).getTime();
      return t >= now.getTime() && t <= now.getTime() + hoursAhead * 3600000;
    });
    if (!future.length) return 0;
    return Math.round(future.reduce((s, h) => s + h.precipitationProbability, 0) / future.length);
  };

  const precipProb1h = getAvgPrecipProb(1);
  const precipProb6h = getAvgPrecipProb(6);
  const precipProb12h = getAvgPrecipProb(12);

  // Thunderstorm probability (WMO codes 95-99)
  const thunderHours = hourly
    .filter(h => {
      const t = new Date(h.time).getTime();
      return t >= now.getTime() && t <= now.getTime() + 12 * 3600000;
    })
    .filter(h => h.weatherCode >= 95);
  const hasThunder = thunderHours.length > 0;

  const summary = `${precipProb1h}% · ${precipProb6h}% · ${precipProb12h}% (1h/6h/12h)`;

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2 C6 5, 3 6, 3 9 A5 5 0 0 0 13 9 C13 6 10 5 8 2 Z"
        stroke="currentColor" strokeWidth={1.3} fill="none" strokeLinejoin="round"
      />
      <path d="M8 12v3M5 13v1.5M11 13v1.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );

  return (
    <CollapsibleCard
      title="Precipitation & Storms"
      summary={summary}
      accentColor="blue"
      icon={icon}
    >
      {/* Current precip */}
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(77,124,255,0.06)', border: '1px solid rgba(77,124,255,0.15)' }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="sg-label block mb-1">CURRENT</span>
            <span className="sg-mono text-sm text-[var(--sg-text-primary)]">
              {current.precipitation > 0
                ? `${formatPrecip(current.precipitation)} — ${current.precipitationType}`
                : 'No precipitation'}
            </span>
          </div>
          <PrecipIntensityIndicator value={current.precipitation} />
        </div>
      </div>

      {/* Probability bars */}
      <div className="mb-4">
        <span className="sg-label block mb-2">RAIN PROBABILITY</span>
        <div className="space-y-2">
          <ProbBar label="Next 1 hour" value={precipProb1h} />
          <ProbBar label="Next 6 hours" value={precipProb6h} />
          <ProbBar label="Next 12 hours" value={precipProb12h} />
        </div>
      </div>

      {/* Daily total */}
      <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(77,124,255,0.04)', border: '1px solid rgba(77,124,255,0.1)' }}>
        <div>
          <span className="sg-label block">TODAY'S TOTAL</span>
          <span className="sg-mono text-sm text-[var(--sg-text-primary)]">{formatPrecip(dailyPrecipTotal)}</span>
        </div>
        <div className="text-right">
          <span className="sg-label block">TYPE</span>
          <span className="sg-mono text-sm capitalize text-[var(--sg-text-secondary)]">
            {current.precipitationType === 'none' ? '—' : current.precipitationType}
          </span>
        </div>
      </div>

      {/* Thunder alert */}
      {hasThunder && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg sg-animate-pulse-glow"
          style={{
            background: 'rgba(255,184,0,0.1)',
            border: '1px solid rgba(255,184,0,0.4)',
          }}
        >
          <span style={{ color: 'var(--sg-amber)', fontSize: '1.2rem' }}>⚡</span>
          <div>
            <span className="sg-label block" style={{ color: 'var(--sg-amber)' }}>THUNDERSTORM RISK</span>
            <span className="sg-mono text-xs text-[var(--sg-text-secondary)]">
              {thunderHours.length} hour{thunderHours.length > 1 ? 's' : ''} in next 12h
            </span>
          </div>
        </div>
      )}
    </CollapsibleCard>
  );
}

function ProbBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'var(--sg-cyan)' : value >= 40 ? 'var(--sg-blue)' : 'var(--sg-text-muted)';
  return (
    <div className="flex items-center gap-3">
      <span className="sg-mono text-xs text-[var(--sg-text-muted)] w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background: color,
            boxShadow: value > 40 ? `0 0 6px ${color}` : 'none',
          }}
        />
      </div>
      <span className="sg-mono text-xs w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function PrecipIntensityIndicator({ value }: { value: number }) {
  const level = value === 0 ? 0 : value < 0.5 ? 1 : value < 2 ? 2 : value < 5 ? 3 : 4;
  const labels = ['None', 'Light', 'Moderate', 'Heavy', 'Intense'];
  const colors = ['var(--sg-text-muted)', 'var(--sg-blue)', 'var(--sg-cyan)', 'var(--sg-amber)', 'var(--sg-red)'];

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(l => (
          <div
            key={l}
            className="rounded-sm"
            style={{
              width: '6px',
              height: `${8 + l * 4}px`,
              background: l <= level ? colors[level] : 'rgba(255,255,255,0.1)',
              boxShadow: l <= level && level > 0 ? `0 0 4px ${colors[level]}` : 'none',
              alignSelf: 'flex-end',
            }}
          />
        ))}
      </div>
      <span className="sg-label">{labels[level]}</span>
    </div>
  );
}
