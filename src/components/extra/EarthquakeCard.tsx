'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import type { EarthquakeEvent } from '@/types/extra';

interface EarthquakeCardProps {
  quakes: EarthquakeEvent[];
  loading?: boolean;
}

export function EarthquakeCard({ quakes, loading }: EarthquakeCardProps) {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8h2l2-4 3 8 2-5 2 3 1-2h2" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const largest = quakes[0];
  const summary = loading
    ? 'Checking seismic activity…'
    : quakes.length === 0
    ? 'No significant seismic activity within 1000 km'
    : `${quakes.length} quake${quakes.length !== 1 ? 's' : ''} · Largest M${largest.magnitude.toFixed(1)} · ${largest.distanceKm} km away`;

  return (
    <CollapsibleCard title="Seismic Activity" summary={summary} accentColor="amber" icon={icon}>
      {loading ? (
        <LoadingRows />
      ) : quakes.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-xs text-[var(--sg-text-muted)]">No earthquakes ≥ M2.5 within 1000 km in recent days.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quakes.slice(0, 8).map(q => (
            <QuakeRow key={q.id} quake={q} />
          ))}
        </div>
      )}
    </CollapsibleCard>
  );
}

function QuakeRow({ quake }: { quake: EarthquakeEvent }) {
  const color = magColor(quake.magnitude);
  const pct = Math.min(100, (quake.magnitude / 8) * 100);
  const timeAgo = formatTimeAgo(quake.time);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="sg-mono font-bold text-sm"
            style={{ color, minWidth: '36px' }}
          >
            M{quake.magnitude.toFixed(1)}
          </span>
          <span className="text-xs text-[var(--sg-text-secondary)] truncate" style={{ maxWidth: '160px' }}>
            {quake.place}
          </span>
        </div>
        <span className="sg-label flex-shrink-0 ml-2" style={{ fontSize: '0.58rem' }}>
          {quake.distanceKm} km
        </span>
      </div>
      {/* Magnitude bar */}
      <div className="h-1 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}40` }}
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="sg-label" style={{ fontSize: '0.56rem' }}>depth {quake.depth} km</span>
        <span className="sg-label" style={{ fontSize: '0.56rem' }}>{timeAgo}</span>
      </div>
    </div>
  );
}

function magColor(m: number): string {
  if (m < 3) return 'var(--sg-green)';
  if (m < 4) return '#aadd00';
  if (m < 5) return 'var(--sg-amber)';
  if (m < 6) return '#ff8800';
  return 'var(--sg-red)';
}

function formatTimeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[70, 85, 60].map((w, i) => (
        <div key={i} className="space-y-1">
          <div className="sg-skeleton rounded" style={{ height: '12px', width: `${w}%` }} />
          <div className="sg-skeleton rounded" style={{ height: '4px', width: '100%' }} />
        </div>
      ))}
    </div>
  );
}
