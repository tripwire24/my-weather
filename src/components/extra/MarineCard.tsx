'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import { windDegToDirection } from '@/lib/formatters';
import type { MarineData } from '@/types/extra';

interface MarineCardProps {
  data: MarineData | null;
  loading?: boolean;
}

function fmt(val: number | null, unit: string): string {
  return val != null ? `${val.toFixed(1)}${unit}` : '—';
}

export function MarineCard({ data, loading }: MarineCardProps) {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 9c1.5-2 3-2 4.5 0s3 2 4.5 0S12.5 7 14 9" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M1 12c1.5-2 3-2 4.5 0s3 2 4.5 0S12.5 10 14 12" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M3 6c1-1.5 2-1.5 3 0s2 1.5 3 0 2-1.5 3 0" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" opacity={0.6} />
    </svg>
  );

  const summary = loading
    ? 'Loading marine data…'
    : !data || !data.available
    ? 'No ocean data for this location'
    : `${fmt(data.waveHeight, 'm')} waves · ${data.waveDirection != null ? windDegToDirection(data.waveDirection) : '—'} swell · ${fmt(data.wavePeriod, 's')} period`;

  return (
    <CollapsibleCard title="Marine Conditions" summary={summary} accentColor="blue" icon={icon}>
      {loading ? (
        <LoadingRows />
      ) : !data || !data.available ? (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">🏔</div>
          <p className="text-xs text-[var(--sg-text-muted)]">This location is too far from the ocean for marine data.</p>
        </div>
      ) : (
        <>
          {/* Primary wave metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricBlock label="WAVE HEIGHT" value={fmt(data.waveHeight, 'm')} color="var(--sg-blue)" />
            <MetricBlock label="WAVE PERIOD" value={fmt(data.wavePeriod, 's')} />
            <MetricBlock
              label="DIRECTION"
              value={data.waveDirection != null ? windDegToDirection(data.waveDirection) : '—'}
              sub={data.waveDirection != null ? `${Math.round(data.waveDirection)}°` : undefined}
            />
          </div>

          <div style={{ height: '1px', background: 'rgba(77,124,255,0.15)', marginBottom: '16px' }} />

          {/* Swell */}
          <div className="sg-label mb-2" style={{ fontSize: '0.6rem' }}>SWELL</div>
          <div className="grid grid-cols-3 gap-3">
            <MetricBlock label="HEIGHT" value={fmt(data.swellHeight, 'm')} color="var(--sg-blue-dim)" />
            <MetricBlock label="PERIOD" value={fmt(data.swellPeriod, 's')} />
            <MetricBlock
              label="FROM"
              value={data.swellDirection != null ? windDegToDirection(data.swellDirection) : '—'}
              sub={data.swellDirection != null ? `${Math.round(data.swellDirection)}°` : undefined}
            />
          </div>

          {/* Sea state label */}
          {data.waveHeight != null && (
            <>
              <div style={{ height: '1px', background: 'rgba(77,124,255,0.15)', margin: '16px 0 12px' }} />
              <div className="flex items-center justify-between">
                <span className="sg-label" style={{ fontSize: '0.6rem' }}>SEA STATE</span>
                <span className="sg-mono text-xs" style={{ color: seaStateColor(data.waveHeight) }}>
                  {seaStateLabel(data.waveHeight)}
                </span>
              </div>
              <SeaStateBar height={data.waveHeight} />
            </>
          )}
        </>
      )}
    </CollapsibleCard>
  );
}

function seaStateLabel(h: number): string {
  if (h < 0.1) return 'Glassy';
  if (h < 0.5) return 'Calm (rippled)';
  if (h < 1.25) return 'Slight';
  if (h < 2.5) return 'Moderate';
  if (h < 4) return 'Rough';
  if (h < 6) return 'Very Rough';
  if (h < 9) return 'High';
  return 'Very High';
}

function seaStateColor(h: number): string {
  if (h < 1.25) return 'var(--sg-green)';
  if (h < 2.5) return 'var(--sg-cyan)';
  if (h < 4) return 'var(--sg-amber)';
  return 'var(--sg-red)';
}

function SeaStateBar({ height }: { height: number }) {
  // Scale: 0–9m mapped to 0–100%
  const pct = Math.min(100, (height / 9) * 100);
  const color = seaStateColor(height);
  return (
    <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  );
}

function MetricBlock({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <div className="sg-label mb-1" style={{ fontSize: '0.58rem' }}>{label}</div>
      <div className="sg-mono text-sm font-semibold" style={{ color: color ?? 'var(--sg-text-primary)' }}>
        {value}
      </div>
      {sub && <div className="sg-label mt-0.5" style={{ fontSize: '0.56rem' }}>{sub}</div>}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {[48, 32, 40].map((w, i) => (
        <div key={i} className="sg-skeleton rounded" style={{ height: '12px', width: `${w}%` }} />
      ))}
    </div>
  );
}
