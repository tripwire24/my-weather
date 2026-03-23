'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import { ArcGauge } from '@/components/ui/ArcGauge';
import { CompassRose } from '@/components/ui/CompassRose';
import { formatWindSpeed, formatPressure, formatVisibility, formatPercent, windDegToDirection } from '@/lib/formatters';
import type { CurrentWeather } from '@/types/weather';

interface WindAtmosphereProps {
  current: CurrentWeather;
  pressureTrend?: 'rising' | 'falling' | 'steady';
}

export function WindAtmosphere({ current, pressureTrend = 'steady' }: WindAtmosphereProps) {
  const summary = `${formatWindSpeed(current.windSpeed)} ${windDegToDirection(current.windDirection)} · ${formatPercent(current.humidity)} humidity`;

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 6c2-2 4-2 6 0s4 2 6 0" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M2 9c2-2 3-2 5 0s3 2 5 0" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M2 12h6" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );

  const trendArrow = pressureTrend === 'rising' ? '↑' : pressureTrend === 'falling' ? '↓' : '→';
  const trendColor = pressureTrend === 'rising' ? 'var(--sg-green)' : pressureTrend === 'falling' ? 'var(--sg-red)' : 'var(--sg-text-muted)';

  return (
    <CollapsibleCard
      title="Wind & Atmosphere"
      summary={summary}
      accentColor="cyan"
      icon={icon}
    >
      {/* Wind row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Compass */}
        <div className="flex flex-col items-center">
          <span className="sg-label mb-2">WIND DIRECTION</span>
          <CompassRose degrees={current.windDirection} size={96} color="#5ce0d6" />
        </div>

        {/* Speed + Gusts */}
        <div className="flex flex-col gap-3 justify-center">
          <DataBlock label="WIND SPEED" value={formatWindSpeed(current.windSpeed)} color="var(--sg-cyan)" />
          <DataBlock label="GUSTS" value={formatWindSpeed(current.windGusts)} color={current.windGusts > 60 ? 'var(--sg-amber)' : 'var(--sg-text-secondary)'} />
          <DataBlock label="DIRECTION" value={`${Math.round(current.windDirection)}° ${windDegToDirection(current.windDirection)}`} color="var(--sg-text-secondary)" />
        </div>
      </div>

      <div className="sg-hr mb-4" />

      {/* Gauges row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Humidity gauge */}
        <ArcGauge
          value={current.humidity}
          size={82}
          color="#6b8cff"
          unit="%"
          label="HUMIDITY"
        />

        {/* Pressure */}
        <div className="flex flex-col items-center gap-1">
          <span className="sg-label">PRESSURE</span>
          <div className="flex flex-col items-center mt-2">
            <span
              className="sg-mono text-base font-semibold"
              style={{ color: 'var(--sg-cyan)' }}
            >
              {Math.round(current.pressure)}
            </span>
            <span className="sg-label">hPa</span>
            <span
              className="text-lg mt-1 font-bold"
              style={{ color: trendColor }}
              title={pressureTrend}
            >
              {trendArrow}
            </span>
            <span className="sg-label capitalize">{pressureTrend}</span>
          </div>
        </div>

        {/* Dew point */}
        <div className="flex flex-col items-center gap-1">
          <span className="sg-label">DEW POINT</span>
          <div className="flex flex-col items-center mt-2">
            <span className="sg-mono text-base font-semibold text-[var(--sg-blue)]">
              {Math.round(current.dewPoint)}°
            </span>
            <span className="sg-label">Celsius</span>
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(92, 224, 214,0.04)', border: '1px solid rgba(92, 224, 214,0.1)' }}>
        <div>
          <span className="sg-label block">VISIBILITY</span>
          <span className="sg-mono text-sm text-[var(--sg-text-primary)]">{formatVisibility(current.visibility)}</span>
        </div>
        <VisibilityBar value={current.visibility} />
      </div>
    </CollapsibleCard>
  );
}

function DataBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="sg-label">{label}</div>
      <div className="sg-mono text-sm font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

function VisibilityBar({ value }: { value: number }) {
  const maxVis = 20; // km
  const pct = Math.min(100, (value / maxVis) * 100);
  const color = value >= 10 ? 'var(--sg-green)' : value >= 5 ? 'var(--sg-amber)' : 'var(--sg-red)';

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="w-24 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <span className="sg-label">{pct >= 90 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 30 ? 'Moderate' : 'Poor'}</span>
    </div>
  );
}
