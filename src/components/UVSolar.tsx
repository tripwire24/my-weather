'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import { Sparkline } from '@/components/ui/Sparkline';
import { uvCategory } from '@/lib/formatters';
import type { CurrentWeather, HourlyForecast } from '@/types/weather';

interface UVSolarProps {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  solarNoon: string;
}

export function UVSolar({ current, hourly, solarNoon }: UVSolarProps) {
  const uv = uvCategory(current.uvIndex);
  const summary = `UV ${Math.round(current.uvIndex)} — ${uv.label}${uv.safeMinutes ? ` · ${uv.safeMinutes}min safe` : ''}`;

  const now = new Date();
  const todayUV = hourly.filter(h => {
    const t = new Date(h.time);
    return t.toDateString() === now.toDateString();
  });
  const uvData = todayUV.map(h => h.uvIndex);

  // Current hour index in today's data
  const currentIdx = todayUV.findIndex(h =>
    Math.abs(new Date(h.time).getTime() - now.getTime()) < 1800000
  );

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth={1.3} />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"
        stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"
      />
    </svg>
  );

  // UV gauge (0-12 scale, capped)
  const uvPct = Math.min(100, (current.uvIndex / 12) * 100);

  return (
    <CollapsibleCard
      title="UV & Solar"
      summary={summary}
      accentColor="amber"
      icon={icon}
    >
      {/* UV index big display */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex flex-col items-center">
          <UVGauge value={current.uvIndex} />
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="sg-mono text-3xl font-bold" style={{ color: uv.color, textShadow: `0 0 12px ${uv.color}` }}>
              {Math.round(current.uvIndex)}
            </span>
            <span className="sg-mono text-sm" style={{ color: uv.color }}>{uv.label}</span>
          </div>

          {uv.safeMinutes && (
            <div className="mb-2">
              <span className="sg-label block">SAFE EXPOSURE</span>
              <span className="sg-mono text-sm text-[var(--sg-text-primary)]">~{uv.safeMinutes} min unprotected</span>
            </div>
          )}

          {!uv.safeMinutes && (
            <div className="mb-2">
              <span className="sg-label block">RISK LEVEL</span>
              <span className="sg-mono text-sm text-[var(--sg-green)]">Low — no protection needed</span>
            </div>
          )}
        </div>
      </div>

      {/* UV Bar scale */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="sg-label">UV SCALE</span>
          <span className="sg-label">0 ——— 12</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full" style={{
            width: `${uvPct}%`,
            background: `linear-gradient(90deg, #00ff88, #ffff00, #ff9900, #ff3355, #ff00ff)`,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div className="flex justify-between mt-0.5">
          {['Low', 'Mod', 'High', 'V.High', 'Extreme'].map(l => (
            <span key={l} className="sg-label text-[9px]">{l}</span>
          ))}
        </div>
      </div>

      {/* Solar noon */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg mb-4"
        style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)' }}
      >
        <div>
          <span className="sg-label block">SOLAR NOON</span>
          <span className="sg-mono text-sm" style={{ color: 'var(--sg-amber)' }}>
            {new Date(solarNoon).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
        </div>
        <span className="text-2xl">☀️</span>
      </div>

      {/* UV today chart */}
      {uvData.length > 0 && (
        <div>
          <span className="sg-label block mb-2">UV TODAY</span>
          <div className="w-full">
            <Sparkline
              data={uvData}
              width={300}
              height={50}
              color={uv.color}
              fillColor={uv.color}
              highlightIndex={currentIdx >= 0 ? currentIdx : undefined}
              showDots={false}
            />
          </div>
        </div>
      )}
    </CollapsibleCard>
  );
}

function UVGauge({ value }: { value: number }) {
  const uv = uvCategory(value);
  const pct = Math.min(100, (value / 12) * 100);

  const size = 80;
  const cx = size / 2;
  const cy = size / 2;
  const r = 28;
  const sw = 6;
  const startA = -210 * (Math.PI / 180);
  const endA = 30 * (Math.PI / 180);
  const totalA = endA - startA;
  const filledA = (pct / 100) * totalA;

  const polarXY = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const s = polarXY(startA);
  const e = polarXY(endA);
  const f = polarXY(startA + filledA);

  const arc = (start: ReturnType<typeof polarXY>, end: ReturnType<typeof polarXY>, large: number) =>
    `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;

  const trackLarge = (endA - startA) > Math.PI ? 1 : 0;
  const fillLarge = filledA > Math.PI ? 1 : 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={arc(s, e, trackLarge)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} strokeLinecap="round" />
      {pct > 0 && (
        <path d={arc(s, f, fillLarge)} fill="none" stroke={uv.color} strokeWidth={sw} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${uv.color})` }}
        />
      )}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={size * 0.2}
        fontFamily="'JetBrains Mono', monospace" fill={uv.color}
        style={{ filter: `drop-shadow(0 0 4px ${uv.color})` }}
      >
        {Math.round(value)}
      </text>
    </svg>
  );
}
