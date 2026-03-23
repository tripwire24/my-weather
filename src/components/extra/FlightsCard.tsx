'use client';

import { useState } from 'react';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import type { FlightInfo, FlightsData } from '@/types/extra';

// ─── helpers ──────────────────────────────────────────────

function fmtAlt(m: number) {
  if (m <= 0) return '—';
  const ft = Math.round(m * 3.28084 / 100) * 100;
  return ft >= 1000 ? `${(ft / 1000).toFixed(0)}k ft` : `${ft} ft`;
}

function altBand(m: number): 'ground' | 'low' | 'mid' | 'cruise' | 'high' {
  if (m < 500)   return 'ground';
  if (m < 3000)  return 'low';
  if (m < 7500)  return 'mid';
  if (m < 11000) return 'cruise';
  return 'high';
}

const ALT_BANDS = [
  { id: 'high',   label: 'HIGH ALT',  range: '> 11km',  color: '#c874e8' },
  { id: 'cruise', label: 'CRUISE',    range: '7.5–11km', color: 'var(--sg-cyan)' },
  { id: 'mid',    label: 'MID',       range: '3–7.5km', color: '#6b8cff' },
  { id: 'low',    label: 'LOW',       range: '< 3km',   color: 'var(--sg-amber)' },
] as const;

function headingArrow(deg: number) {
  const dirs = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  return dirs[Math.round(deg / 45) % 8];
}

function altColor(m: number) {
  if (m > 9000) return 'var(--sg-text-primary)';
  if (m > 4500) return '#6b8cff';
  return 'var(--sg-text-secondary)';
}

// ─── CSS animations ───────────────────────────────────────

const RADAR_STYLES = `
@keyframes radar-sweep {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes blip-fade {
  0%   { opacity: 1;   r: 3; }
  60%  { opacity: 0.5; r: 5; }
  100% { opacity: 1;   r: 3; }
}
`;

// ─── Radar map ────────────────────────────────────────────

function FlightRadar({ flights, userLat, userLon }: {
  flights: FlightInfo[];
  userLat?: number;
  userLon?: number;
}) {
  const cx = 110; const cy = 110; const maxR = 90;
  const maxDeg = 1.5; // ±1.5° bounding box

  const rings = [50, 100, 150]; // km approx

  return (
    <div style={{ position: 'relative', marginBottom: '8px' }}>
      <style>{RADAR_STYLES}</style>
      <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: '220px', display: 'block', margin: '0 auto' }}>
        {/* Outer disc */}
        <circle cx={cx} cy={cy} r={maxR + 5} fill="rgba(92, 224, 214,0.03)" />

        {/* Grid rings */}
        {rings.map((km, i) => {
          const r = (km / 167) * maxR;
          return (
            <g key={km}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(92, 224, 214,0.12)" strokeWidth={1}
                strokeDasharray={i === rings.length - 1 ? 'none' : '3 4'} />
              <text x={cx + r + 2} y={cy - 3} fontSize="6" fontFamily="'JetBrains Mono',monospace"
                fill="rgba(92, 224, 214,0.35)">{km}km</text>
            </g>
          );
        })}

        {/* Cardinal labels */}
        {[['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([label, deg]) => {
          const rad = ((Number(deg) - 90) * Math.PI) / 180;
          const lx = cx + Math.cos(rad) * (maxR + 12);
          const ly = cy + Math.sin(rad) * (maxR + 12);
          return (
            <text key={label} x={lx} y={ly + 3} textAnchor="middle" fontSize="7"
              fontFamily="'JetBrains Mono',monospace" fill="rgba(92, 224, 214,0.35)">{label}</text>
          );
        })}

        {/* Cross hairs */}
        <line x1={cx} y1={cy - maxR - 2} x2={cx} y2={cy + maxR + 2} stroke="rgba(92, 224, 214,0.1)" strokeWidth={0.5} />
        <line x1={cx - maxR - 2} y1={cy} x2={cx + maxR + 2} y2={cy} stroke="rgba(92, 224, 214,0.1)" strokeWidth={0.5} />

        {/* Sweep line (rotating gradient) */}
        <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'radar-sweep 4s linear infinite' }}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - maxR} stroke="var(--sg-cyan)" strokeWidth={1} opacity={0.6} />
          {/* Sweep trail as arc */}
          <path
            d={`M${cx},${cy} L${cx},${cy - maxR} A${maxR},${maxR} 0 0 0 ${cx - maxR * Math.sin((30 * Math.PI) / 180)},${cy - maxR * Math.cos((30 * Math.PI) / 180)} Z`}
            fill="var(--sg-cyan)" opacity={0.04}
          />
        </g>

        {/* User position */}
        <circle cx={cx} cy={cy} r={4} fill="var(--sg-cyan)" opacity={0.9}
          style={{ filter: 'drop-shadow(0 0 4px var(--sg-cyan))' }} />

        {/* Aircraft blips */}
        {flights.map((f, i) => {
          let fx: number, fy: number;
          if (f.lat != null && f.lon != null && userLat != null && userLon != null) {
            const dx = (f.lon - userLon) / maxDeg * maxR;
            const dy = -(f.lat - userLat) / maxDeg * maxR;
            fx = cx + dx;
            fy = cy + dy;
          } else {
            // Distribute evenly in a ring if no coords
            const angle = (i / flights.length) * 2 * Math.PI - Math.PI / 2;
            const r = 30 + (i % 3) * 20;
            fx = cx + Math.cos(angle) * r;
            fy = cy + Math.sin(angle) * r;
          }

          // Clip to maxR
          const dist = Math.sqrt((fx - cx) ** 2 + (fy - cy) ** 2);
          if (dist > maxR) {
            const scale = (maxR - 2) / dist;
            fx = cx + (fx - cx) * scale;
            fy = cy + (fy - cy) * scale;
          }

          const band = altBand(f.altitude);
          const color = ALT_BANDS.find(b => b.id === band)?.color ?? 'var(--sg-cyan)';

          // Aircraft triangle pointing in heading direction
          const rad = ((f.heading - 90) * Math.PI) / 180;
          const s = 5;
          const tip   = { x: fx + Math.cos(rad) * s,               y: fy + Math.sin(rad) * s };
          const left  = { x: fx + Math.cos(rad + 2.5) * s * 0.5,   y: fy + Math.sin(rad + 2.5) * s * 0.5 };
          const right = { x: fx + Math.cos(rad - 2.5) * s * 0.5,   y: fy + Math.sin(rad - 2.5) * s * 0.5 };
          const tail  = { x: fx - Math.cos(rad) * s * 0.4,          y: fy - Math.sin(rad) * s * 0.4 };

          return (
            <g key={`${f.callsign}-${i}`}>
              {/* Blip glow */}
              <circle cx={fx} cy={fy} r={6} fill={color} opacity={0.08} />
              {/* Aircraft shape */}
              <path
                d={`M${tip.x},${tip.y} L${left.x},${left.y} L${tail.x},${tail.y} L${right.x},${right.y} Z`}
                fill={color}
                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
              />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-1">
        {ALT_BANDS.map(b => (
          <div key={b.id} className="flex items-center gap-1">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.color }} />
            <span className="sg-label" style={{ fontSize: '0.5rem', color: b.color }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Altitude histogram ───────────────────────────────────

function AltitudeHistogram({ flights }: { flights: FlightInfo[] }) {
  const bands = ALT_BANDS.map(b => ({
    ...b,
    count: flights.filter(f => altBand(f.altitude) === b.id).length,
  }));
  const maxCount = Math.max(1, ...bands.map(b => b.count));

  return (
    <div className="space-y-2">
      {bands.map(b => (
        <div key={b.id} className="flex items-center gap-2">
          <span className="sg-mono flex-shrink-0" style={{ fontSize: '0.6rem', color: b.color, width: '56px' }}>
            {b.label}
          </span>
          <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(b.count / maxCount) * 100}%`,
                background: b.color,
                boxShadow: b.count > 0 ? `0 0 6px ${b.color}50` : 'none',
                minWidth: b.count > 0 ? '4px' : '0',
              }} />
          </div>
          <span className="sg-mono flex-shrink-0" style={{ fontSize: '0.6rem', color: b.count > 0 ? b.color : 'var(--sg-text-muted)', width: '16px', textAlign: 'right' }}>
            {b.count}
          </span>
          <span className="sg-label flex-shrink-0" style={{ fontSize: '0.5rem', width: '44px' }}>{b.range}</span>
        </div>
      ))}
    </div>
  );
}

// ─── sort toggle ──────────────────────────────────────────

type SortMode = 'alt' | 'speed' | 'country';

function SortToggle({ mode, onChange }: { mode: SortMode; onChange: (m: SortMode) => void }) {
  const opts: { id: SortMode; label: string }[] = [
    { id: 'alt',     label: 'ALTITUDE' },
    { id: 'speed',   label: 'SPEED'    },
    { id: 'country', label: 'COUNTRY'  },
  ];
  return (
    <div className="flex gap-1 mb-2" style={{ background: 'rgba(92, 224, 214,0.06)', borderRadius: '8px', padding: '3px' }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="flex-1 py-1.5 rounded-md sg-mono transition-all active:opacity-70"
          style={{
            fontSize: '0.57rem',
            letterSpacing: '0.08em',
            background: mode === o.id ? 'rgba(92, 224, 214,0.18)' : 'transparent',
            color: mode === o.id ? 'var(--sg-cyan)' : 'var(--sg-text-muted)',
            boxShadow: mode === o.id ? '0 0 8px rgba(92, 224, 214,0.2)' : 'none',
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── flight row ───────────────────────────────────────────

function FlightRow({ flight }: { flight: FlightInfo }) {
  const [expanded, setExpanded] = useState(false);
  const band = altBand(flight.altitude);
  const bandColor = ALT_BANDS.find(b => b.id === band)?.color ?? 'var(--sg-cyan)';

  return (
    <div className="rounded-lg transition-all duration-200"
      style={{
        background: expanded ? 'rgba(92, 224, 214,0.04)' : 'transparent',
        border: expanded ? '1px solid rgba(92, 224, 214,0.1)' : '1px solid transparent',
      }}>
      <button onClick={() => setExpanded(v => !v)}
        className="w-full grid gap-x-2 items-center px-2 py-1.5 rounded-lg active:opacity-70"
        style={{ gridTemplateColumns: '68px 1fr 56px 44px 28px' }}>
        <span className="sg-mono font-semibold truncate text-left" style={{ fontSize: '0.7rem', color: 'var(--sg-cyan)' }}>
          {flight.callsign}
        </span>
        <span className="text-left truncate" style={{ fontSize: '0.65rem', color: 'var(--sg-text-secondary)' }}>
          {flight.originCountry}
        </span>
        <span className="sg-mono text-right" style={{ fontSize: '0.65rem', color: altColor(flight.altitude) }}>
          {fmtAlt(flight.altitude)}
        </span>
        <span className="sg-mono text-right" style={{ fontSize: '0.65rem', color: 'var(--sg-text-secondary)' }}>
          {flight.velocity > 0 ? flight.velocity : '—'}
        </span>
        <span className="sg-mono text-right" style={{ fontSize: '0.8rem', color: 'var(--sg-text-muted)' }}>
          {headingArrow(flight.heading)}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-2.5 grid grid-cols-3 gap-2">
          <DetailItem label="ALTITUDE"  value={`${Math.round(flight.altitude)}m`} color={altColor(flight.altitude)} />
          <DetailItem label="SPEED"     value={`${flight.velocity} km/h`} />
          <DetailItem label="HEADING"   value={`${flight.heading}° ${headingArrow(flight.heading)}`} />
          <DetailItem label="FL BAND"   value={ALT_BANDS.find(b => b.id === band)?.label ?? band} color={bandColor} />
          <div className="col-span-2">
            <DetailItem label="ORIGIN"  value={flight.originCountry} />
          </div>
          {flight.lat != null && flight.lon != null && (
            <div className="col-span-3">
              <DetailItem label="POSITION" value={`${flight.lat.toFixed(3)}°, ${flight.lon.toFixed(3)}°`} />
            </div>
          )}
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

// ─── main component ───────────────────────────────────────

interface FlightsCardProps {
  data: FlightsData | null;
  loading?: boolean;
  userLat?: number;
  userLon?: number;
}

export function FlightsCard({ data, loading, userLat, userLon }: FlightsCardProps) {
  const [sortMode, setSortMode] = useState<SortMode>('alt');

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2l5 3.5-2 .5-3-2-3 3 1.5 1L5.5 10 4 9 1.5 12v2l2-.5 4-5 1.5 1.5L11 7.5l3 1.5 1-2L11 4l1-1.5L8 2Z"
        stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" fill="none" />
    </svg>
  );

  const summary = loading
    ? 'Scanning overhead traffic…'
    : !data
    ? 'Flight data unavailable'
    : data.count === 0
    ? 'No aircraft currently overhead'
    : `${data.count} aircraft overhead${data.flights[0] ? ` · ${data.flights[0].callsign} at ${fmtAlt(data.flights[0].altitude)}` : ''}`;

  const sorted = data ? [...data.flights].sort((a, b) => {
    if (sortMode === 'speed')   return b.velocity - a.velocity;
    if (sortMode === 'country') return a.originCountry.localeCompare(b.originCountry);
    return b.altitude - a.altitude;
  }) : [];

  return (
    <CollapsibleCard title="Overhead Flights" summary={summary} accentColor="cyan" icon={icon}>
      {loading ? (
        <LoadingRows />
      ) : !data || data.count === 0 ? (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">✈️</div>
          <p className="text-xs text-[var(--sg-text-muted)]">
            {!data ? 'Could not reach OpenSky Network.' : 'Clear skies — no aircraft within 150 km.'}
          </p>
        </div>
      ) : (
        <>
          {/* Count hero */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="sg-mono font-bold" style={{ fontSize: '2.2rem', color: 'var(--sg-cyan)' }}>
              {data.count}
            </span>
            <span className="sg-label" style={{ fontSize: '0.65rem' }}>AIRCRAFT OVERHEAD (±150 KM)</span>
          </div>

          {/* Radar map */}
          <FlightRadar flights={data.flights} userLat={userLat} userLon={userLon} />

          {/* Altitude histogram */}
          <div style={{ height: '1px', background: 'rgba(92, 224, 214,0.12)', margin: '12px 0' }} />
          <div className="sg-label mb-2" style={{ fontSize: '0.6rem' }}>ALTITUDE DISTRIBUTION</div>
          <AltitudeHistogram flights={data.flights} />

          {/* Flight table */}
          <div style={{ height: '1px', background: 'rgba(92, 224, 214,0.12)', margin: '12px 0' }} />

          {/* Column headers */}
          <div className="grid gap-x-2 mb-1 px-2" style={{ gridTemplateColumns: '68px 1fr 56px 44px 28px' }}>
            {[
              { id: 'callsign', label: 'CALLSIGN' },
              { id: 'country',  label: 'COUNTRY'  },
              { id: 'alt',      label: 'ALT'       },
              { id: 'speed',    label: 'KPH'       },
              { id: 'hdg',      label: 'HDG'       },
            ].map(h => (
              <span key={h.id} className="sg-label" style={{ fontSize: '0.52rem', textAlign: h.id === 'hdg' ? 'right' : h.id === 'alt' || h.id === 'speed' ? 'right' : 'left' }}>
                {h.label}
              </span>
            ))}
          </div>

          <SortToggle mode={sortMode} onChange={setSortMode} />

          <div className="space-y-0.5">
            {sorted.slice(0, 12).map((f, i) => (
              <FlightRow key={`${f.callsign}-${i}`} flight={f} />
            ))}
          </div>

          {data.count > 12 && (
            <div className="sg-label mt-2 text-center" style={{ fontSize: '0.58rem' }}>
              + {data.count - 12} more aircraft not shown
            </div>
          )}
        </>
      )}
    </CollapsibleCard>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      <div className="sg-skeleton rounded-full" style={{ height: '160px', width: '160px', margin: '0 auto' }} />
      {[60, 80, 70, 65].map((w, i) => (
        <div key={i} className="sg-skeleton rounded" style={{ height: '20px', width: `${w}%` }} />
      ))}
    </div>
  );
}
