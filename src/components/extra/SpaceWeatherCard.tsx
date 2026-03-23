'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import type { SpaceWeatherData } from '@/types/extra';

// ─── constants ────────────────────────────────────────────

const AURORA_COLORS: Record<SpaceWeatherData['auroraChance'], string> = {
  none:     'var(--sg-text-muted)',
  low:      'var(--sg-cyan)',
  possible: '#aaffaa',
  likely:   'var(--sg-green)',
  high:     '#c874e8',
};

const AURORA_LABELS: Record<SpaceWeatherData['auroraChance'], string> = {
  none:     'No aurora expected',
  low:      'Aurora at high latitudes (≥65°)',
  possible: 'Aurora possible at mid-latitudes (≥55°)',
  likely:   'Aurora likely at mid-latitudes (≥45°)',
  high:     'Aurora visible at low latitudes (≥35°)',
};

const AURORA_LATITUDES: Record<SpaceWeatherData['auroraChance'], { lat: string; regions: string }[]> = {
  none:     [],
  low:      [{ lat: '≥65°', regions: 'Alaska, Iceland, Norway, N. Canada' }],
  possible: [{ lat: '≥65°', regions: 'Alaska, Iceland, Norway' }, { lat: '≥55°', regions: 'Scotland, Denmark, S. Canada' }],
  likely:   [{ lat: '≥65°', regions: 'Alaska, Iceland, Norway' }, { lat: '≥55°', regions: 'Scotland, Denmark, S. Canada' }, { lat: '≥45°', regions: 'N. USA, Germany, Poland' }],
  high:     [{ lat: '≥65°', regions: 'Alaska, Iceland' }, { lat: '≥55°', regions: 'Scotland, S. Canada' }, { lat: '≥45°', regions: 'N. USA, Germany' }, { lat: '≥35°', regions: 'S. France, N. Japan, Patagonia' }],
};

function kpColor(kp: number) {
  if (kp < 3) return 'var(--sg-cyan)';
  if (kp < 5) return 'var(--sg-amber)';
  if (kp < 7) return '#ff8800';
  return 'var(--sg-red)';
}

// ─── CSS animations ───────────────────────────────────────

const SPACE_STYLES = `
@keyframes aurora-drift {
  0%   { transform: translateX(0) skewY(0deg);    opacity: 0.15; }
  33%  { transform: translateX(6px) skewY(1.5deg); opacity: 0.35; }
  66%  { transform: translateX(-4px) skewY(-1deg); opacity: 0.25; }
  100% { transform: translateX(0) skewY(0deg);    opacity: 0.15; }
}
@keyframes aurora-drift-2 {
  0%   { transform: translateX(0) skewY(0deg);     opacity: 0.25; }
  40%  { transform: translateX(-8px) skewY(2deg);  opacity: 0.5; }
  75%  { transform: translateX(5px) skewY(-1.5deg); opacity: 0.3; }
  100% { transform: translateX(0) skewY(0deg);     opacity: 0.25; }
}
@keyframes aurora-drift-3 {
  0%   { transform: translateX(0) skewY(0deg);    opacity: 0.1; }
  50%  { transform: translateX(10px) skewY(2deg); opacity: 0.4; }
  100% { transform: translateX(0) skewY(0deg);    opacity: 0.1; }
}
@keyframes kp-pulse {
  0%, 100% { filter: drop-shadow(0 0 4px currentColor); }
  50%       { filter: drop-shadow(0 0 12px currentColor); }
}
@keyframes storm-flash {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
`;

// ─── Aurora curtain display ───────────────────────────────

function AuroraCurtain({ chance }: { chance: SpaceWeatherData['auroraChance'] }) {
  if (chance === 'none') return null;
  const color = AURORA_COLORS[chance];
  const intensity = { low: 1, possible: 1.5, likely: 2, high: 3 }[chance] ?? 1;

  // Multiple vertical curtain "rays" at different phases
  const rays = [
    { x: 10, w: 24, dur: '5s',   delay: '0s',    anim: 'aurora-drift' },
    { x: 38, w: 18, dur: '3.5s', delay: '0.8s',  anim: 'aurora-drift-2' },
    { x: 62, w: 28, dur: '6s',   delay: '0.3s',  anim: 'aurora-drift-3' },
    { x: 96, w: 20, dur: '4s',   delay: '1.2s',  anim: 'aurora-drift' },
    { x: 122, w: 30, dur: '7s',  delay: '0.5s',  anim: 'aurora-drift-2' },
    { x: 158, w: 16, dur: '3s',  delay: '1.5s',  anim: 'aurora-drift-3' },
    { x: 182, w: 22, dur: '5.5s',delay: '0.2s',  anim: 'aurora-drift' },
    { x: 210, w: 28, dur: '4.5s',delay: '0.9s',  anim: 'aurora-drift-2' },
    { x: 244, w: 18, dur: '6.5s',delay: '0.6s',  anim: 'aurora-drift-3' },
    { x: 268, w: 24, dur: '4s',  delay: '1.1s',  anim: 'aurora-drift' },
    { x: 296, w: 14, dur: '3.5s',delay: '0.4s',  anim: 'aurora-drift-2' },
  ];

  return (
    <div style={{ height: '72px', borderRadius: '10px', overflow: 'hidden',
      background: 'rgba(0,0,0,0.2)', position: 'relative', marginBottom: '4px' }}>
      <svg viewBox="0 0 320 72" style={{ width: '100%', height: '72px', position: 'absolute', inset: 0 }}
        preserveAspectRatio="none">
        <defs>
          <linearGradient id={`aurora-grad-${chance}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.9 * intensity / 3} />
            <stop offset="70%" stopColor={color} stopOpacity={0.3 * intensity / 3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {rays.map((ray, i) => (
          <rect key={i}
            x={ray.x} y={0} width={ray.w} height={72}
            rx={ray.w / 2}
            fill={`url(#aurora-grad-${chance})`}
            style={{ animation: `${ray.anim} ${ray.dur} ease-in-out infinite`, animationDelay: ray.delay }}
          />
        ))}
      </svg>
      {/* Label overlay */}
      <div style={{ position: 'absolute', bottom: '6px', right: '10px' }}>
        <span className="sg-mono" style={{ fontSize: '0.6rem', color, opacity: 0.8 }}>AURORA DISPLAY</span>
      </div>
    </div>
  );
}

// ─── Kp scale ─────────────────────────────────────────────

function KpScale({ kp }: { kp: number }) {
  const pct = (kp / 9) * 100;
  return (
    <div>
      <div className="relative h-2.5 rounded-full overflow-hidden mb-1"
        style={{ background: 'linear-gradient(90deg, var(--sg-cyan), #88ffcc, var(--sg-amber), #ff8800, var(--sg-red))' }}>
        <div className="absolute top-0 bottom-0 w-0.5 rounded-full"
          style={{ left: `${Math.min(97, pct)}%`, background: '#fff', boxShadow: '0 0 6px #fff',
            animation: 'kp-pulse 2s ease-in-out infinite' }} />
      </div>
      <div className="flex justify-between px-0.5">
        {[
          { l: 'QUIET', c: 'var(--sg-cyan)' },
          { l: 'UNSETTLED', c: '#88ffcc' },
          { l: 'ACTIVE', c: 'var(--sg-amber)' },
          { l: 'STORM', c: '#ff8800' },
          { l: 'EXTREME', c: 'var(--sg-red)' },
        ].map(({ l, c }) => (
          <span key={l} className="sg-label" style={{ fontSize: '0.48rem', color: c }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ─── 24h sparkline ────────────────────────────────────────

function KpSparkline({ history, current }: {
  history: { time: string; kp: number }[];
  current: number;
}) {
  const maxKp = 9;
  const W = 300; const H = 50;
  const pts = history.map((r, i) => {
    const x = (i / Math.max(1, history.length - 1)) * W;
    const y = H - (r.kp / maxKp) * H;
    return { x, y, kp: r.kp, time: r.time };
  });
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const fillPath = pts.length > 1
    ? `M0,${H} L${pts.map(p => `${p.x},${p.y}`).join(' L')} L${W},${H} Z`
    : '';
  const color = kpColor(current);
  const stormY = H - (5 / maxKp) * H;

  // Find peak
  const peak = pts.reduce((m, p) => (p.kp > m.kp ? p : m), pts[0]);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '50px' }} preserveAspectRatio="none">
        {/* G1 storm threshold */}
        <line x1={0} y1={stormY} x2={W} y2={stormY}
          stroke="rgba(200, 116, 232,0.25)" strokeWidth={1} strokeDasharray="4 3" />
        <text x={W - 2} y={stormY - 3} textAnchor="end" fontSize="7"
          fontFamily="'JetBrains Mono',monospace" fill="rgba(200, 116, 232,0.4)">G1</text>

        {/* Fill */}
        {fillPath && <path d={fillPath} fill={color} opacity={0.1} />}
        {/* Line */}
        {pts.length > 1 && (
          <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        )}
        {/* Peak marker */}
        {peak && peak.kp > 2 && (
          <g>
            <circle cx={peak.x} cy={peak.y} r={3} fill={kpColor(peak.kp)}
              style={{ filter: `drop-shadow(0 0 3px ${kpColor(peak.kp)})` }} />
            <text x={Math.min(W - 14, peak.x)} y={Math.max(10, peak.y - 5)}
              fontSize="7" fontFamily="'JetBrains Mono',monospace"
              fill={kpColor(peak.kp)} opacity={0.8}>{peak.kp.toFixed(1)}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── main component ───────────────────────────────────────

interface SpaceWeatherCardProps {
  data: SpaceWeatherData | null;
  loading?: boolean;
}

export function SpaceWeatherCard({ data, loading }: SpaceWeatherCardProps) {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth={1.3} />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.42 1.42M3.05 12.95l1.42-1.42M11.54 4.46l1.42-1.42"
        stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />
    </svg>
  );

  const summary = loading
    ? 'Fetching space weather…'
    : !data
    ? 'Space weather unavailable'
    : `Kp ${data.kpIndex.toFixed(1)} · ${data.kpLabel} · ${data.auroraChance === 'none' ? 'No aurora' : 'Aurora ' + data.auroraChance}`;

  return (
    <CollapsibleCard title="Space Weather" summary={summary} accentColor="magenta" icon={icon}>
      <style>{SPACE_STYLES}</style>
      {loading ? (
        <LoadingRows />
      ) : !data ? (
        <div className="text-center py-4">
          <p className="text-xs text-[var(--sg-text-muted)]">Could not reach NOAA space weather service.</p>
        </div>
      ) : (
        <>
          {/* Storm alert banner */}
          {data.kpIndex >= 5 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
              style={{
                background: 'rgba(232, 92, 120,0.12)',
                border: '1px solid rgba(232, 92, 120,0.4)',
                animation: 'storm-flash 2s ease-in-out infinite',
              }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2L13 12H1L7 2Z" stroke="var(--sg-red)" strokeWidth={1.3} strokeLinejoin="round" />
                <path d="M7 6v3M7 10.5v.5" stroke="var(--sg-red)" strokeWidth={1.3} strokeLinecap="round" />
              </svg>
              <span className="sg-mono text-xs font-bold" style={{ color: 'var(--sg-red)' }}>
                GEOMAGNETIC STORM — Kp {data.kpIndex.toFixed(1)} ({data.kpLabel})
              </span>
            </div>
          )}

          {/* Aurora curtain display */}
          <AuroraCurtain chance={data.auroraChance} />

          {/* Kp hero */}
          <div className="flex items-end gap-4 mb-4">
            <div>
              <div className="sg-label mb-1" style={{ fontSize: '0.6rem' }}>KP INDEX</div>
              <div className="sg-mono font-bold" style={{ fontSize: '3rem', lineHeight: 1, color: kpColor(data.kpIndex),
                animation: data.kpIndex >= 5 ? 'kp-pulse 2s ease-in-out infinite' : 'none' }}>
                {data.kpIndex.toFixed(1)}
              </div>
              <div className="sg-mono text-xs mt-1 font-semibold" style={{ color: kpColor(data.kpIndex) }}>
                {data.kpLabel.toUpperCase()}
              </div>
            </div>
            <div className="flex-1 mb-2">
              <KpScale kp={data.kpIndex} />
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(200, 116, 232,0.15)', marginBottom: '14px' }} />

          {/* Aurora visibility */}
          <div className="flex items-start gap-2 mb-3">
            <AuroraIcon chance={data.auroraChance} />
            <div className="flex-1">
              <div className="sg-label mb-1" style={{ fontSize: '0.6rem' }}>AURORA FORECAST</div>
              <div className="text-xs font-semibold mb-2" style={{ color: AURORA_COLORS[data.auroraChance] }}>
                {AURORA_LABELS[data.auroraChance]}
              </div>

              {/* Latitude table */}
              {AURORA_LATITUDES[data.auroraChance].length > 0 && (
                <div className="space-y-1.5">
                  {AURORA_LATITUDES[data.auroraChance].map(({ lat, regions }) => (
                    <div key={lat} className="flex items-start gap-2">
                      <span className="sg-mono flex-shrink-0"
                        style={{ fontSize: '0.62rem', color: AURORA_COLORS[data.auroraChance], minWidth: '28px' }}>
                        {lat}
                      </span>
                      <span className="sg-label" style={{ fontSize: '0.58rem', lineHeight: 1.4 }}>{regions}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Kp meaning legend */}
          <div style={{ height: '1px', background: 'rgba(200, 116, 232,0.15)', marginBottom: '14px' }} />
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { range: '0–2', label: 'Quiet',         color: 'var(--sg-cyan)',   desc: 'Calm conditions' },
              { range: '3–4', label: 'Active',         color: 'var(--sg-amber)', desc: 'High-lat aurora' },
              { range: '5–9', label: 'Storm',          color: 'var(--sg-red)',   desc: 'Mid-lat aurora' },
            ].map(({ range, label, color, desc }) => (
              <div key={range} className="text-center px-1 py-2 rounded-lg"
                style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                <div className="sg-mono font-bold" style={{ fontSize: '0.7rem', color }}>{range}</div>
                <div className="sg-label mt-0.5" style={{ fontSize: '0.55rem', color }}>{label}</div>
                <div className="sg-label mt-0.5" style={{ fontSize: '0.5rem' }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* 24h sparkline */}
          {data.history.length > 2 && (
            <>
              <div style={{ height: '1px', background: 'rgba(200, 116, 232,0.15)', marginBottom: '12px' }} />
              <div className="sg-label mb-2" style={{ fontSize: '0.6rem' }}>24H KP HISTORY</div>
              <KpSparkline history={data.history} current={data.kpIndex} />
              <div className="flex justify-between mt-1">
                <span className="sg-label" style={{ fontSize: '0.55rem' }}>24h ago</span>
                <span className="sg-label" style={{ fontSize: '0.55rem' }}>
                  <span style={{ color: 'rgba(200, 116, 232,0.5)' }}>— — </span>G1 storm threshold
                </span>
                <span className="sg-label" style={{ fontSize: '0.55rem' }}>now</span>
              </div>
            </>
          )}
        </>
      )}
    </CollapsibleCard>
  );
}

function AuroraIcon({ chance }: { chance: SpaceWeatherData['auroraChance'] }) {
  const color = AURORA_COLORS[chance];
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
      <path d="M4 20c2-4 4-6 6-8s4-3 6-8" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
      <path d="M8 20c1-3 2-5 4-7s3-4 4-8" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
      <path d="M12 20c0-3 1-5 2-7s1-4 2-7" stroke={color} strokeWidth={1} strokeLinecap="round" opacity={0.4} />
    </svg>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      <div className="sg-skeleton rounded" style={{ height: '72px', width: '100%' }} />
      <div className="sg-skeleton rounded" style={{ height: '48px', width: '80px' }} />
      <div className="sg-skeleton rounded" style={{ height: '8px', width: '100%' }} />
      <div className="sg-skeleton rounded" style={{ height: '50px', width: '100%' }} />
    </div>
  );
}
