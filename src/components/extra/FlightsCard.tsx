'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import type { FlightInfo, FlightsData } from '@/types/extra';

interface FlightsCardProps {
  data: FlightsData | null;
  loading?: boolean;
}

export function FlightsCard({ data, loading }: FlightsCardProps) {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9 2.5L13 6l-2 1-3-2-3 3 1.5 1L5 10.5 3.5 9 1 11.5V13.5l2-0.5 4-5 1.5 1.5L10 8.5l3 2 1-2L10 5l1.5-1.5L9 2.5Z" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" fill="none" />
    </svg>
  );

  const summary = loading
    ? 'Scanning overhead traffic…'
    : !data
    ? 'Flight data unavailable'
    : data.count === 0
    ? 'No aircraft currently overhead'
    : `${data.count} aircraft overhead${data.flights[0] ? ` · ${data.flights[0].callsign} at ${fmtAlt(data.flights[0].altitude)}` : ''}`;

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
          {/* Count header */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="sg-mono font-bold" style={{ fontSize: '2rem', color: 'var(--sg-cyan)' }}>
              {data.count}
            </span>
            <span className="sg-label" style={{ fontSize: '0.65rem' }}>AIRCRAFT OVERHEAD (±150 KM)</span>
          </div>

          {/* Table header */}
          <div className="grid gap-x-2 mb-2" style={{ gridTemplateColumns: '70px 1fr 60px 50px 36px' }}>
            {['CALLSIGN', 'COUNTRY', 'ALT', 'SPEED', 'HDG'].map(h => (
              <span key={h} className="sg-label" style={{ fontSize: '0.55rem' }}>{h}</span>
            ))}
          </div>

          <div style={{ height: '1px', background: 'rgba(0,255,242,0.1)', marginBottom: '8px' }} />

          {/* Flight rows */}
          <div className="space-y-2">
            {data.flights.slice(0, 12).map((f, i) => (
              <FlightRow key={`${f.callsign}-${i}`} flight={f} />
            ))}
          </div>

          {data.count > 12 && (
            <div className="sg-label mt-3 text-center" style={{ fontSize: '0.58rem' }}>
              + {data.count - 12} more aircraft not shown
            </div>
          )}
        </>
      )}
    </CollapsibleCard>
  );
}

function FlightRow({ flight }: { flight: FlightInfo }) {
  return (
    <div
      className="grid gap-x-2 items-center py-1 rounded"
      style={{ gridTemplateColumns: '70px 1fr 60px 50px 36px' }}
    >
      <span className="sg-mono text-xs font-semibold truncate" style={{ color: 'var(--sg-cyan)' }}>
        {flight.callsign}
      </span>
      <span className="text-xs text-[var(--sg-text-secondary)] truncate" style={{ fontSize: '0.7rem' }}>
        {flight.originCountry}
      </span>
      <span className="sg-mono text-right" style={{ fontSize: '0.7rem', color: altColor(flight.altitude) }}>
        {fmtAlt(flight.altitude)}
      </span>
      <span className="sg-mono text-right" style={{ fontSize: '0.7rem', color: 'var(--sg-text-secondary)' }}>
        {flight.velocity > 0 ? `${flight.velocity}` : '—'}
      </span>
      <span className="sg-mono text-right" style={{ fontSize: '0.7rem', color: 'var(--sg-text-muted)' }}>
        {headingArrow(flight.heading)}
      </span>
    </div>
  );
}

function fmtAlt(m: number): string {
  if (m <= 0) return '—';
  const ft = Math.round(m * 3.28084 / 100) * 100;
  return ft >= 1000 ? `${(ft / 1000).toFixed(0)}k ft` : `${ft} ft`;
}

function altColor(m: number): string {
  if (m > 9000) return 'var(--sg-text-primary)';
  if (m > 4500) return 'var(--sg-cyan-dim)';
  return 'var(--sg-text-secondary)';
}

function headingArrow(deg: number): string {
  const dirs = ['↑','↗','→','↘','↓','↙','←','↖'];
  return dirs[Math.round(deg / 45) % 8];
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {[60, 80, 70, 65].map((w, i) => (
        <div key={i} className="sg-skeleton rounded" style={{ height: '20px', width: `${w}%` }} />
      ))}
    </div>
  );
}
