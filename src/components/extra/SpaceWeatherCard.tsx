'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import type { SpaceWeatherData } from '@/types/extra';

interface SpaceWeatherCardProps {
  data: SpaceWeatherData | null;
  loading?: boolean;
}

const AURORA_COLORS: Record<SpaceWeatherData['auroraChance'], string> = {
  none:     'var(--sg-text-muted)',
  low:      'var(--sg-cyan)',
  possible: '#aaffaa',
  likely:   'var(--sg-green)',
  high:     '#ff00ff',
};

const AURORA_LABELS: Record<SpaceWeatherData['auroraChance'], string> = {
  none:     'No aurora expected',
  low:      'Aurora at high latitudes',
  possible: 'Aurora possible at mid-latitudes',
  likely:   'Aurora likely at mid-latitudes',
  high:     'Aurora visible at low latitudes',
};

function kpColor(kp: number): string {
  if (kp < 3) return 'var(--sg-cyan)';
  if (kp < 5) return 'var(--sg-amber)';
  if (kp < 7) return '#ff8800';
  return 'var(--sg-red)';
}

export function SpaceWeatherCard({ data, loading }: SpaceWeatherCardProps) {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth={1.3} />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.42 1.42M3.05 12.95l1.42-1.42M11.54 4.46l1.42-1.42" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />
    </svg>
  );

  const summary = loading
    ? 'Fetching space weather…'
    : !data
    ? 'Space weather unavailable'
    : `Kp ${data.kpIndex.toFixed(1)} · ${data.kpLabel} · ${data.auroraChance === 'none' ? 'No aurora' : 'Aurora ' + data.auroraChance}`;

  return (
    <CollapsibleCard title="Space Weather" summary={summary} accentColor="magenta" icon={icon}>
      {loading ? (
        <LoadingRows />
      ) : !data ? (
        <div className="text-center py-4">
          <p className="text-xs text-[var(--sg-text-muted)]">Could not reach NOAA space weather service.</p>
        </div>
      ) : (
        <>
          {/* Kp gauge row */}
          <div className="flex items-end gap-4 mb-4">
            <div>
              <div className="sg-label mb-1" style={{ fontSize: '0.6rem' }}>KP INDEX</div>
              <div
                className="sg-mono font-bold"
                style={{ fontSize: '3rem', lineHeight: 1, color: kpColor(data.kpIndex) }}
              >
                {data.kpIndex.toFixed(1)}
              </div>
              <div
                className="sg-mono text-xs mt-1 font-semibold"
                style={{ color: kpColor(data.kpIndex) }}
              >
                {data.kpLabel.toUpperCase()}
              </div>
            </div>
            <div className="flex-1 mb-1">
              <KpScale kp={data.kpIndex} />
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,0,255,0.15)', marginBottom: '16px' }} />

          {/* Aurora */}
          <div className="flex items-center gap-2 mb-4">
            <AuroraIcon chance={data.auroraChance} />
            <div>
              <div className="sg-label" style={{ fontSize: '0.6rem' }}>AURORA</div>
              <div
                className="text-xs font-semibold mt-0.5"
                style={{ color: AURORA_COLORS[data.auroraChance] }}
              >
                {AURORA_LABELS[data.auroraChance]}
              </div>
            </div>
          </div>

          {/* 24h history sparkline */}
          {data.history.length > 2 && (
            <>
              <div style={{ height: '1px', background: 'rgba(255,0,255,0.15)', marginBottom: '12px' }} />
              <div className="sg-label mb-2" style={{ fontSize: '0.6rem' }}>24H HISTORY</div>
              <KpSparkline history={data.history} current={data.kpIndex} />
              <div className="flex justify-between mt-1">
                <span className="sg-label" style={{ fontSize: '0.55rem' }}>24h ago</span>
                <span className="sg-label" style={{ fontSize: '0.55rem' }}>now</span>
              </div>
            </>
          )}
        </>
      )}
    </CollapsibleCard>
  );
}

function KpScale({ kp }: { kp: number }) {
  const segments = [
    { max: 2, label: 'Q', color: 'var(--sg-cyan)' },
    { max: 3, label: 'U', color: '#88ffcc' },
    { max: 5, label: 'A', color: 'var(--sg-amber)' },
    { max: 7, label: 'S', color: '#ff8800' },
    { max: 9, label: 'X', color: 'var(--sg-red)' },
  ];
  const pct = (kp / 9) * 100;
  return (
    <div>
      <div className="relative h-2 rounded-full overflow-hidden mb-1"
        style={{ background: 'linear-gradient(90deg, var(--sg-cyan), #88ffcc, var(--sg-amber), #ff8800, var(--sg-red))' }}>
        {/* Needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 rounded-full"
          style={{
            left: `${Math.min(97, pct)}%`,
            background: '#fff',
            boxShadow: '0 0 6px #fff',
          }}
        />
      </div>
      <div className="flex justify-between">
        {segments.map(s => (
          <span key={s.label} className="sg-label" style={{ fontSize: '0.5rem', color: s.color }}>{s.label}</span>
        ))}
      </div>
    </div>
  );
}

function KpSparkline({ history, current }: { history: { time: string; kp: number }[]; current: number }) {
  const maxKp = 9;
  const w = 300;
  const h = 40;
  const pts = history.map((r, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - (r.kp / maxKp) * h;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const fillPath = `M0,${h} L${pts[0]} L${pts.join(' L')} L${w},${h} Z`;
  const color = kpColor(current);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '40px' }} preserveAspectRatio="none">
      {/* Storm threshold line at Kp 5 */}
      <line
        x1="0" y1={h - (5 / maxKp) * h}
        x2={w} y2={h - (5 / maxKp) * h}
        stroke="rgba(255,0,255,0.2)" strokeWidth={1} strokeDasharray="4 3"
      />
      <path d={fillPath} fill={color} opacity={0.12} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

function AuroraIcon({ chance }: { chance: SpaceWeatherData['auroraChance'] }) {
  const color = AURORA_COLORS[chance];
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4 20c2-4 4-6 6-8s4-3 6-8" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
      <path d="M8 20c1-3 2-5 4-7s3-4 4-8" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
      <path d="M12 20c0-3 1-5 2-7s1-4 2-7" stroke={color} strokeWidth={1} strokeLinecap="round" opacity={0.4} />
    </svg>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      <div className="sg-skeleton rounded" style={{ height: '48px', width: '80px' }} />
      <div className="sg-skeleton rounded" style={{ height: '8px', width: '100%' }} />
      <div className="sg-skeleton rounded" style={{ height: '40px', width: '100%' }} />
    </div>
  );
}
