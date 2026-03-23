'use client';

import { useState } from 'react';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import type { EarthquakeEvent } from '@/types/extra';

// ─── helpers ──────────────────────────────────────────────

function magColor(m: number) {
  if (m < 3) return 'var(--sg-green)';
  if (m < 4) return '#aadd00';
  if (m < 5) return 'var(--sg-amber)';
  if (m < 6) return '#ff8800';
  return 'var(--sg-red)';
}

function formatTimeAgo(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isRecent(ms: number) {
  return Date.now() - ms < 24 * 60 * 60 * 1000;
}

function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(rLat2);
  const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// ─── Radar plot ───────────────────────────────────────────

const RADAR_STYLES = `
@keyframes eq-ripple {
  0%   { r: 4; opacity: 0.8; }
  60%  { r: 14; opacity: 0.3; }
  100% { r: 18; opacity: 0; }
}
@keyframes eq-pulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
`;

function SeismicRadar({ quakes, userLat, userLon }: {
  quakes: EarthquakeEvent[];
  userLat?: number;
  userLon?: number;
}) {
  const cx = 110; const cy = 110; const maxR = 95;
  const rings = [250, 500, 750, 1000];

  return (
    <div style={{ position: 'relative', marginBottom: '4px' }}>
      <style>{RADAR_STYLES}</style>
      <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: '220px', display: 'block', margin: '0 auto' }}>
        {/* Background */}
        <circle cx={cx} cy={cy} r={maxR + 4} fill="rgba(232, 168, 48,0.03)" />

        {/* Distance rings */}
        {rings.map((km, i) => {
          const r = (km / 1000) * maxR;
          return (
            <g key={km}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(232, 168, 48,0.12)" strokeWidth={1}
                strokeDasharray={i === rings.length - 1 ? 'none' : '3 4'} />
              <text x={cx + r + 2} y={cy - 2} fontSize="6" fontFamily="'JetBrains Mono',monospace"
                fill="rgba(232, 168, 48,0.35)">{km}km</text>
            </g>
          );
        })}

        {/* Cardinal markers */}
        {[['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([label, deg]) => {
          const rad = ((Number(deg) - 90) * Math.PI) / 180;
          const lx = cx + Math.cos(rad) * (maxR + 10);
          const ly = cy + Math.sin(rad) * (maxR + 10);
          return (
            <text key={label} x={lx} y={ly + 3} textAnchor="middle" fontSize="7"
              fontFamily="'JetBrains Mono',monospace" fill="rgba(232, 168, 48,0.4)">{label}</text>
          );
        })}

        {/* User position */}
        <circle cx={cx} cy={cy} r={4} fill="var(--sg-cyan)" opacity={0.9}
          style={{ filter: 'drop-shadow(0 0 4px var(--sg-cyan))' }} />
        <line x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} stroke="var(--sg-cyan)" strokeWidth={1} opacity={0.5} />
        <line x1={cx} y1={cy - 7} x2={cx} y2={cy + 7} stroke="var(--sg-cyan)" strokeWidth={1} opacity={0.5} />

        {/* Quake dots */}
        {quakes.map(q => {
          const bearing = (userLat != null && userLon != null)
            ? bearingDeg(userLat, userLon, q.lat, q.lon)
            : 0;
          const r_px = Math.min(maxR - 4, (q.distanceKm / 1000) * maxR);
          const rad = ((bearing - 90) * Math.PI) / 180;
          const qx = cx + Math.cos(rad) * r_px;
          const qy = cy + Math.sin(rad) * r_px;
          const color = magColor(q.magnitude);
          const dotR = Math.max(3, q.magnitude * 1.2);
          const recent = isRecent(q.time);

          return (
            <g key={q.id}>
              {/* Ripple for recent quakes */}
              {recent && (
                <circle cx={qx} cy={qy} r={4} fill="none" stroke={color} strokeWidth={1.5} opacity={0}>
                  <animate attributeName="r" values="4;16;20" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.2;0" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={qx} cy={qy} r={dotR} fill={color} opacity={recent ? 1 : 0.65}
                style={{ filter: recent ? `drop-shadow(0 0 4px ${color})` : 'none' }}>
                {recent && (
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                )}
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── sort toggle ──────────────────────────────────────────

type SortMode = 'time' | 'mag' | 'dist';

function SortToggle({ mode, onChange }: { mode: SortMode; onChange: (m: SortMode) => void }) {
  const opts: { id: SortMode; label: string }[] = [
    { id: 'time', label: 'RECENT' },
    { id: 'mag',  label: 'MAGNITUDE' },
    { id: 'dist', label: 'NEAREST' },
  ];
  return (
    <div className="flex gap-1 mb-3" style={{ background: 'rgba(232, 168, 48,0.06)', borderRadius: '8px', padding: '3px' }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="flex-1 py-1.5 rounded-md sg-mono transition-all active:opacity-70"
          style={{
            fontSize: '0.57rem',
            letterSpacing: '0.08em',
            background: mode === o.id ? 'rgba(232, 168, 48,0.2)' : 'transparent',
            color: mode === o.id ? 'var(--sg-amber)' : 'var(--sg-text-muted)',
            boxShadow: mode === o.id ? '0 0 8px rgba(232, 168, 48,0.2)' : 'none',
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── quake row ────────────────────────────────────────────

function QuakeRow({ quake, index }: { quake: EarthquakeEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const color = magColor(quake.magnitude);
  const pct = Math.min(100, (quake.magnitude / 8) * 100);
  const recent = isRecent(quake.time);

  return (
    <div
      className="rounded-lg transition-all duration-200"
      style={{
        background: expanded ? 'rgba(232, 168, 48,0.05)' : 'transparent',
        border: expanded ? '1px solid rgba(232, 168, 48,0.12)' : '1px solid transparent',
        animationDelay: `${index * 60}ms`,
      }}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-2 py-2 rounded-lg active:opacity-70"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {recent && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0,
                boxShadow: `0 0 6px ${color}`,
                display: 'inline-block',
              }} />
            )}
            <span className="sg-mono font-bold text-sm" style={{ color, minWidth: '36px' }}>
              M{quake.magnitude.toFixed(1)}
            </span>
            <span className="text-xs text-[var(--sg-text-secondary)] truncate" style={{ maxWidth: '150px' }}>
              {quake.place}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="sg-label" style={{ fontSize: '0.57rem' }}>{quake.distanceKm} km</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{ color: 'var(--sg-text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}40` }} />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
          <DetailItem label="OCCURRED" value={formatTimeAgo(quake.time)} />
          <DetailItem label="DISTANCE" value={`${quake.distanceKm} km`} />
          <DetailItem label="DEPTH" value={`${quake.depth} km`} />
          <DetailItem label="MAGNITUDE" value={`M${quake.magnitude.toFixed(1)}`} color={color} />
          <div className="col-span-2">
            <DetailItem label="LOCATION" value={quake.place} />
          </div>
          <div className="col-span-2">
            <DetailItem label="COORDS"
              value={`${quake.lat.toFixed(3)}°, ${quake.lon.toFixed(3)}°`} />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="sg-label mb-0.5" style={{ fontSize: '0.55rem' }}>{label}</div>
      <div className="sg-mono text-xs" style={{ color: color ?? 'var(--sg-text-secondary)' }}>{value}</div>
    </div>
  );
}

// ─── stats bar ────────────────────────────────────────────

function StatsBar({ quakes }: { quakes: EarthquakeEvent[] }) {
  const maxMag = Math.max(...quakes.map(q => q.magnitude));
  const avgDepth = Math.round(quakes.reduce((s, q) => s + q.depth, 0) / quakes.length);
  const nearest = Math.min(...quakes.map(q => q.distanceKm));
  const recentCount = quakes.filter(q => isRecent(q.time)).length;

  return (
    <div className="grid grid-cols-4 gap-2 mb-3 px-1">
      <StatChip label="TOTAL" value={String(quakes.length)} />
      <StatChip label="LARGEST" value={`M${maxMag.toFixed(1)}`} color={magColor(maxMag)} />
      <StatChip label="NEAREST" value={`${nearest}km`} />
      <StatChip label="RECENT" value={String(recentCount)} color={recentCount > 0 ? 'var(--sg-amber)' : undefined} />
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <div className="sg-label" style={{ fontSize: '0.5rem' }}>{label}</div>
      <div className="sg-mono text-xs font-semibold mt-0.5" style={{ color: color ?? 'var(--sg-text-primary)' }}>{value}</div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────

interface EarthquakeCardProps {
  quakes: EarthquakeEvent[];
  loading?: boolean;
  userLat?: number;
  userLon?: number;
}

export function EarthquakeCard({ quakes, loading, userLat, userLon }: EarthquakeCardProps) {
  const [sortMode, setSortMode] = useState<SortMode>('time');

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

  const sorted = [...quakes].sort((a, b) => {
    if (sortMode === 'mag')  return b.magnitude - a.magnitude;
    if (sortMode === 'dist') return a.distanceKm - b.distanceKm;
    return b.time - a.time;
  });

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
        <>
          <StatsBar quakes={quakes} />

          {/* Radar plot */}
          <SeismicRadar quakes={quakes} userLat={userLat} userLon={userLon} />

          {/* Magnitude legend */}
          <div className="flex items-center justify-center gap-4 mb-3">
            {[
              { label: '< M3', color: 'var(--sg-green)' },
              { label: 'M3–4', color: '#aadd00' },
              { label: 'M4–5', color: 'var(--sg-amber)' },
              { label: 'M5+',  color: 'var(--sg-red)' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                <span className="sg-label" style={{ fontSize: '0.52rem', color }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: 'rgba(232, 168, 48,0.12)', marginBottom: '12px' }} />

          <SortToggle mode={sortMode} onChange={setSortMode} />

          <div className="space-y-1">
            {sorted.slice(0, 8).map((q, i) => (
              <QuakeRow key={q.id} quake={q} index={i} />
            ))}
          </div>

          {quakes.length > 8 && (
            <div className="sg-label mt-3 text-center" style={{ fontSize: '0.58rem' }}>
              {quakes.length - 8} more quakes not shown
            </div>
          )}
        </>
      )}
    </CollapsibleCard>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      <div className="sg-skeleton rounded-full" style={{ height: '160px', width: '160px', margin: '0 auto' }} />
      {[70, 85, 60].map((w, i) => (
        <div key={i} className="space-y-1">
          <div className="sg-skeleton rounded" style={{ height: '12px', width: `${w}%` }} />
          <div className="sg-skeleton rounded" style={{ height: '4px', width: '100%' }} />
        </div>
      ))}
    </div>
  );
}
