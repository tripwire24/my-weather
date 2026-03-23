'use client';

import { useState } from 'react';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import { CompassRose } from '@/components/ui/CompassRose';
import { windDegToDirection } from '@/lib/formatters';
import type { MarineData } from '@/types/extra';

// ─── helpers ──────────────────────────────────────────────

function fmt(val: number | null, unit: string) {
  return val != null ? `${val.toFixed(1)}${unit}` : '—';
}

function seaStateLabel(h: number) {
  if (h < 0.1) return 'Glassy';
  if (h < 0.5) return 'Calm';
  if (h < 1.25) return 'Slight';
  if (h < 2.5) return 'Moderate';
  if (h < 4) return 'Rough';
  if (h < 6) return 'Very Rough';
  if (h < 9) return 'High';
  return 'Very High';
}

function seaStateColor(h: number) {
  if (h < 1.25) return 'var(--sg-green)';
  if (h < 2.5) return 'var(--sg-cyan)';
  if (h < 4) return 'var(--sg-amber)';
  return 'var(--sg-red)';
}

function surfRating(h: number | null, p: number | null) {
  if (h == null || p == null) return { label: 'Unknown', color: 'var(--sg-text-muted)', score: 0 };
  if (p >= 12 && h >= 0.5 && h <= 3)  return { label: 'Excellent', color: 'var(--sg-green)', score: 4 };
  if (p >= 8  && h >= 0.3 && h <= 4)  return { label: 'Good',      color: '#88ff44',          score: 3 };
  if (p >= 6  && h >= 0.2 && h <= 5)  return { label: 'Fair',      color: 'var(--sg-amber)',   score: 2 };
  return { label: 'Poor', color: 'var(--sg-red)', score: 1 };
}

function waveEnergy(h: number | null, t: number | null) {
  if (h == null || t == null) return '—';
  return `${Math.round(h * h * t)} m²·s`;
}

// ─── animated wave SVG ────────────────────────────────────

function WaveVisual({ height, period, swellH, swellP }: {
  height: number; period: number; swellH: number; swellP: number;
}) {
  const amp1 = Math.min(20, Math.max(3, height * 8));
  const amp2 = Math.min(12, Math.max(2, swellH * 5));
  const midY = 42;
  const W = 640; // twice viewport for seamless loop

  function buildPath(amp: number, waves = 8) {
    const seg = W / waves;
    let d = `M0,${midY}`;
    for (let i = 0; i < waves; i++) {
      const x1 = i * seg;
      const x2 = x1 + seg;
      const cx1 = x1 + seg * 0.25;
      const cx2 = x1 + seg * 0.75;
      const y = i % 2 === 0 ? midY - amp : midY + amp;
      d += ` C${cx1},${y} ${cx2},${y} ${x2},${midY}`;
    }
    return d;
  }

  const p1 = buildPath(amp1, 8);
  const p2 = buildPath(amp2, 6);
  const dur1 = `${Math.max(1.5, period * 0.7).toFixed(1)}s`;
  const dur2 = `${Math.max(2.5, swellP * 0.5).toFixed(1)}s`;

  return (
    <div style={{ overflow: 'hidden', height: '68px', borderRadius: '8px', background: 'rgba(107, 140, 255,0.04)', marginBottom: '4px' }}>
      <svg viewBox="0 0 320 80" style={{ width: '100%', height: '68px' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="mg-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b8cff" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#6b8cff" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        {/* swell (background) */}
        <g>
          <path d={`${p2} L${W},80 L0,80 Z`} fill="#6b8cff" opacity={0.06}>
            <animateTransform attributeName="transform" type="translate"
              from="0 0" to="-320 0" dur={dur2} repeatCount="indefinite" />
          </path>
          <path d={p2} fill="none" stroke="#6b8cff" strokeWidth={1} opacity={0.25}>
            <animateTransform attributeName="transform" type="translate"
              from="0 0" to="-320 0" dur={dur2} repeatCount="indefinite" />
          </path>
        </g>
        {/* primary wave (foreground) */}
        <g>
          <path d={`${p1} L${W},80 L0,80 Z`} fill="url(#mg-fill)">
            <animateTransform attributeName="transform" type="translate"
              from="0 0" to="-320 0" dur={dur1} repeatCount="indefinite" />
          </path>
          <path d={p1} fill="none" stroke="#6b8cff" strokeWidth={1.6} opacity={0.85}>
            <animateTransform attributeName="transform" type="translate"
              from="0 0" to="-320 0" dur={dur1} repeatCount="indefinite" />
          </path>
        </g>
        {/* height label */}
        <text x="8" y="14" fontFamily="'JetBrains Mono',monospace" fontSize="10" fill="#6b8cff" opacity={0.7}>
          {height.toFixed(1)}m
        </text>
      </svg>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────

type MarineTab = 'waves' | 'swell' | 'surf';

function TabStrip({ active, onChange }: { active: MarineTab; onChange: (t: MarineTab) => void }) {
  const tabs: { id: MarineTab; label: string }[] = [
    { id: 'waves', label: 'WAVES' },
    { id: 'swell', label: 'SWELL' },
    { id: 'surf',  label: 'SURF'  },
  ];
  return (
    <div className="flex gap-1 mb-3" style={{ background: 'rgba(107, 140, 255,0.06)', borderRadius: '8px', padding: '3px' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex-1 py-1.5 rounded-md sg-mono transition-all active:opacity-70"
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
            background: active === t.id ? 'rgba(107, 140, 255,0.25)' : 'transparent',
            color: active === t.id ? '#6b8cff' : 'var(--sg-text-muted)',
            boxShadow: active === t.id ? '0 0 8px rgba(107, 140, 255,0.3)' : 'none',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function MetricBlock({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div>
      <div className="sg-label mb-1" style={{ fontSize: '0.57rem' }}>{label}</div>
      <div className="sg-mono text-sm font-semibold" style={{ color: color ?? 'var(--sg-text-primary)' }}>{value}</div>
      {sub && <div className="sg-label mt-0.5" style={{ fontSize: '0.55rem' }}>{sub}</div>}
    </div>
  );
}

function SeaStateBar({ height }: { height: number }) {
  const pct = Math.min(100, (height / 9) * 100);
  const color = seaStateColor(height);
  return (
    <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
    </div>
  );
}

function SurfStars({ score }: { score: number }) {
  return (
    <div className="flex gap-1 mt-1">
      {[1, 2, 3, 4].map(n => (
        <div key={n} style={{ width: 8, height: 8, borderRadius: '50%',
          background: n <= score ? 'var(--sg-green)' : 'rgba(255,255,255,0.1)',
          boxShadow: n <= score ? '0 0 6px var(--sg-green)' : 'none',
        }} />
      ))}
    </div>
  );
}

function SurfFact({ label, value, ideal }: { label: string; value: string; ideal?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="sg-label" style={{ fontSize: '0.62rem' }}>{label}</span>
      <div className="text-right">
        <span className="sg-mono text-xs">{value}</span>
        {ideal && <span className="sg-label ml-2" style={{ fontSize: '0.55rem' }}>ideal {ideal}</span>}
      </div>
    </div>
  );
}

function Divider({ color = 'rgba(107, 140, 255,0.15)' }: { color?: string }) {
  return <div style={{ height: '1px', background: color, margin: '14px 0' }} />;
}

// ─── main component ───────────────────────────────────────

interface MarineCardProps {
  data: MarineData | null;
  loading?: boolean;
}

export function MarineCard({ data, loading }: MarineCardProps) {
  const [tab, setTab] = useState<MarineTab>('waves');

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
    : `${fmt(data.waveHeight, 'm')} waves · ${data.waveDirection != null ? windDegToDirection(data.waveDirection) : '—'} · ${fmt(data.wavePeriod, 's')}`;

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
          <TabStrip active={tab} onChange={setTab} />

          <WaveVisual
            height={data.waveHeight ?? 1}
            period={data.wavePeriod ?? 8}
            swellH={data.swellHeight ?? 0.5}
            swellP={data.swellPeriod ?? 12}
          />

          {/* WAVES TAB */}
          {tab === 'waves' && (
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MetricBlock label="HEIGHT" value={fmt(data.waveHeight, 'm')} color="var(--sg-blue)" />
                <MetricBlock label="PERIOD" value={fmt(data.wavePeriod, 's')} />
                <MetricBlock label="ENERGY" value={waveEnergy(data.waveHeight, data.wavePeriod)} />
              </div>

              {data.waveHeight != null && (
                <>
                  <Divider />
                  <div className="flex items-center justify-between mb-1">
                    <span className="sg-label" style={{ fontSize: '0.6rem' }}>SEA STATE</span>
                    <span className="sg-mono text-xs font-semibold" style={{ color: seaStateColor(data.waveHeight) }}>
                      {seaStateLabel(data.waveHeight)}
                    </span>
                  </div>
                  <SeaStateBar height={data.waveHeight} />
                  <div className="flex justify-between mt-1">
                    {['Glassy', 'Slight', 'Moderate', 'Rough', 'High'].map((s, i) => (
                      <span key={s} className="sg-label" style={{ fontSize: '0.48rem', opacity: i < 3 ? 0.5 : 0.3 }}>{s}</span>
                    ))}
                  </div>
                </>
              )}

              {data.waveDirection != null && (
                <>
                  <Divider />
                  <div className="sg-label mb-2" style={{ fontSize: '0.6rem' }}>WAVE DIRECTION</div>
                  <div className="flex justify-center">
                    <CompassRose degrees={data.waveDirection} size={104} color="#6b8cff" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* SWELL TAB */}
          {tab === 'swell' && (
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MetricBlock label="HEIGHT" value={fmt(data.swellHeight, 'm')} color="#6b8cff" />
                <MetricBlock label="PERIOD" value={fmt(data.swellPeriod, 's')} />
                <MetricBlock label="ENERGY" value={waveEnergy(data.swellHeight, data.swellPeriod)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricBlock label="WAVE HEIGHT" value={fmt(data.waveHeight, 'm')} />
                <MetricBlock
                  label="SWELL RATIO"
                  value={data.swellHeight != null && data.waveHeight != null && data.waveHeight > 0
                    ? `${Math.round((data.swellHeight / data.waveHeight) * 100)}%`
                    : '—'
                  }
                  sub="of total wave"
                />
              </div>

              {data.swellDirection != null && (
                <>
                  <Divider />
                  <div className="sg-label mb-2" style={{ fontSize: '0.6rem' }}>SWELL DIRECTION (FROM)</div>
                  <div className="flex justify-center">
                    <CompassRose degrees={data.swellDirection} size={104} color="#6b8cff" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* SURF TAB */}
          {tab === 'surf' && (() => {
            const rating = surfRating(data.waveHeight, data.wavePeriod);
            return (
              <div className="mt-3 space-y-4">
                {/* Rating hero */}
                <div className="flex items-center gap-4 px-2 py-3 rounded-xl"
                  style={{ background: `${rating.color}10`, border: `1px solid ${rating.color}30` }}>
                  <div className="text-3xl">🏄</div>
                  <div>
                    <div className="sg-label mb-1" style={{ fontSize: '0.6rem' }}>SURF QUALITY</div>
                    <div className="sg-mono text-xl font-bold" style={{ color: rating.color }}>{rating.label}</div>
                    <SurfStars score={rating.score} />
                  </div>
                  {/* Score ring */}
                  <div className="ml-auto">
                    <svg width="48" height="48" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="19" fill="none" stroke={rating.color} strokeWidth={2} opacity={0.15} />
                      <circle cx="24" cy="24" r="19" fill="none" stroke={rating.color} strokeWidth={2}
                        strokeDasharray={`${(rating.score / 4) * 119.4} 119.4`}
                        strokeDashoffset="29.85"
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 4px ${rating.color})` }}
                      />
                      <text x="24" y="29" textAnchor="middle" fontSize="14" fontFamily="'JetBrains Mono',monospace"
                        fill={rating.color} fontWeight="bold">{rating.score}/4</text>
                    </svg>
                  </div>
                </div>

                <Divider />

                <div className="space-y-2">
                  <SurfFact label="Wave height" value={fmt(data.waveHeight, 'm')} ideal="0.5 – 3m" />
                  <SurfFact label="Wave period" value={fmt(data.wavePeriod, 's')} ideal="≥ 8s" />
                  <SurfFact label="Swell period" value={fmt(data.swellPeriod, 's')} ideal="≥ 12s" />
                  <SurfFact label="Wave energy" value={waveEnergy(data.waveHeight, data.wavePeriod)} />
                </div>

                <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="sg-label mb-1" style={{ fontSize: '0.58rem' }}>READING THIS</div>
                  <p className="text-xs text-[var(--sg-text-muted)]" style={{ lineHeight: 1.5 }}>
                    Longer periods mean more organised swell. 8s+ with 0.5–3m height is typically good surfing.
                    Higher energy (H²×T) indicates more powerful waves.
                  </p>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </CollapsibleCard>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      <div className="sg-skeleton rounded" style={{ height: '68px', width: '100%' }} />
      <div className="sg-skeleton rounded" style={{ height: '12px', width: '60%' }} />
      <div className="sg-skeleton rounded" style={{ height: '12px', width: '40%' }} />
    </div>
  );
}
