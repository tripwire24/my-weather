'use client';

import { useState, useEffect, useRef } from 'react';
import { WeatherIcon } from '@/components/ui/WeatherIcon';
import {
  formatTemp, formatTime, formatRelativeTime, wmoLabel,
  uvCategory, windDegToDirection, formatVisibility,
} from '@/lib/formatters';
import type { WeatherData } from '@/types/weather';
import type { HeroWidgetId } from '@/hooks/useHeroPreferences';

interface HeroSectionProps {
  data: WeatherData | null;
  loading: boolean;
  isStale: boolean;
  lastUpdated: string | null;
  onLocationTap: () => void;
  onCustomize: () => void;
  enabledWidgets: Set<HeroWidgetId>;
}

// Smooth count-up: animates from prev value (or 0 on first mount) to target
function useCountUp(target: number, duration = 950): number {
  const [val, setVal] = useState(0);
  const prevRef = useRef<number | null>(null);
  useEffect(() => {
    const from = prevRef.current ?? 0;
    prevRef.current = target;
    if (from === target) { setVal(target); return; }
    let rafId: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // cubic ease-out
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return val;
}

export function HeroSection({
  data,
  loading,
  isStale,
  lastUpdated,
  onLocationTap,
  onCustomize,
  enabledWidgets,
}: HeroSectionProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });
  const [expandedWidget, setExpandedWidget] = useState<HeroWidgetId | null>(null);
  // Hook must be called unconditionally — passes 0 until data arrives
  const displayTemp = useCountUp(data ? Math.round(data.current.temperature) : 0);

  if (loading && !data) return <HeroSkeleton />;
  if (!data) return null;

  const { current, location, daily, sun } = data;
  const today = daily[0];
  const uv = uvCategory(current.uvIndex);
  const hasAlert = current.uvIndex >= 8 || current.windGusts > 80;

  const widgetOrder: HeroWidgetId[] = [
    'wind', 'humidity', 'uv', 'precip_prob', 'pressure',
    'dewpoint', 'visibility', 'cloud_cover', 'sunrise_sunset',
  ];
  const activeWidgets = widgetOrder.filter(id => enabledWidgets.has(id));
  const defs = buildWidgetDefs(data);

  const handleWidgetTap = (id: HeroWidgetId) => {
    setExpandedWidget(prev => (prev === id ? null : id));
  };

  return (
    <div className="relative px-4 pt-safe-top pb-2 sg-animate-fade-in">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none sg-animate-light-pulse"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,242,0.07) 0%, transparent 70%)', borderRadius: '0 0 40% 40%' }}
      />

      {/* Top row: location + time + customize */}
      <div className="flex items-start justify-between mb-1 relative">
        <button
          onClick={onLocationTap}
          className="flex items-center gap-1.5 group flex-1 min-w-0 mr-2"
          aria-label="Change location"
        >
          <LocationPinIcon />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--sg-text-primary)] group-hover:text-[var(--sg-cyan)] transition-colors leading-tight truncate">
              {location.name}
            </div>
            {location.region && (
              <div className="sg-label truncate">{location.region}{location.country ? `, ${location.country}` : ''}</div>
            )}
          </div>
        </button>

        <div className="flex items-start gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="sg-mono text-sm text-[var(--sg-text-primary)]">{timeStr}</div>
            {lastUpdated && (
              <div className="sg-label">{formatRelativeTime(lastUpdated)}</div>
            )}
          </div>
          {/* Customize button — 36×36 for comfortable mobile tapping */}
          <button
            onClick={onCustomize}
            className="mt-0.5 flex items-center justify-center w-9 h-9 rounded-lg transition-all active:opacity-70 active:scale-95"
            style={{ border: '1px solid rgba(0,255,242,0.2)', color: 'var(--sg-text-muted)' }}
            aria-label="Customise hero dashboard"
            title="Customise"
          >
            <svg width="15" height="15" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth={1.2} />
              <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
              <path d="M2.64 2.64l1.06 1.06M8.3 8.3l1.06 1.06M9.36 2.64L8.3 3.7M3.7 8.3l-1.06 1.06" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main temp row */}
      <div className="flex items-end gap-4 mt-2">
        <div className="flex-1">
          <div className="flex items-start gap-1">
            <span
              className="sg-mono font-bold leading-none sg-glow-cyan"
              style={{ fontSize: 'clamp(3.8rem, 18vw, 5.5rem)', color: 'var(--sg-cyan)' }}
            >
              {displayTemp}
            </span>
            <span
              className="sg-mono font-light mt-2"
              style={{ fontSize: '1.8rem', color: 'var(--sg-cyan-dim)' }}
            >
              °C
            </span>
          </div>

          <div className="flex items-center gap-2 -mt-1">
            <span className="sg-label">FEELS</span>
            <span className="sg-mono text-xs text-[var(--sg-text-secondary)]">
              {formatTemp(current.feelsLike)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={18} color="var(--sg-cyan)" />
            <span className="text-sm text-[var(--sg-text-secondary)]">
              {wmoLabel(current.weatherCode)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="sg-animate-float">
            <WeatherIcon
              code={current.weatherCode}
              isDay={current.isDay}
              size={60}
              color="var(--sg-cyan)"
            />
          </div>
          {today && (
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="sg-label">HI</div>
                <div className="sg-mono text-sm font-semibold text-[var(--sg-text-primary)]">
                  {formatTemp(today.tempMax)}
                </div>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'var(--sg-border)' }} />
              <div className="text-center">
                <div className="sg-label">LO</div>
                <div className="sg-mono text-sm text-[var(--sg-text-secondary)]">
                  {formatTemp(today.tempMin)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customisable widget tiles — tapping opens a floating popover */}
      {activeWidgets.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {activeWidgets.map((id, i) => (
            <HeroWidget
              key={id}
              def={defs[id]}
              isActive={expandedWidget === id}
              onTap={() => handleWidgetTap(id)}
              sheenDelay={`${i * 0.7}s`}
              entranceIndex={i}
            />
          ))}
        </div>
      )}

      {/* Alert + Status bar */}
      <div className="flex items-center justify-between mt-2.5 gap-2">
        {hasAlert ? (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs sg-mono"
            style={{
              background: 'rgba(255,184,0,0.1)',
              border: '1px solid rgba(255,184,0,0.35)',
              color: 'var(--sg-amber)',
            }}
          >
            <span>⚡</span>
            <span>
              {current.uvIndex >= 8
                ? `UV ${Math.round(current.uvIndex)} — ${uv.label}`
                : `Gusts ${Math.round(current.windGusts)} km/h`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full sg-animate-data-blink"
              style={{ background: 'var(--sg-green)', boxShadow: '0 0 6px var(--sg-green)' }}
            />
            <span className="sg-label">LIVE</span>
          </div>
        )}
        {isStale && <div className="sg-stale-badge">⚠ STALE</div>}
      </div>

      <div className="sg-divider mt-3" />

      {/* Floating widget detail popover */}
      {expandedWidget && defs[expandedWidget] && (
        <WidgetPopover
          def={defs[expandedWidget]}
          onClose={() => setExpandedWidget(null)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
//  Widget definition builder
// ──────────────────────────────────────────────────────────
type WidgetDef = {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  details: React.ReactNode;
};

function buildWidgetDefs(data: WeatherData): Record<HeroWidgetId, WidgetDef> {
  const { current, sun, daily, hourly } = data;
  const today = daily[0];
  const uv = uvCategory(current.uvIndex);

  const beaufort = (spd: number): string => {
    if (spd < 1) return 'Calm';
    if (spd < 6) return 'Light air';
    if (spd < 12) return 'Light breeze';
    if (spd < 20) return 'Gentle breeze';
    if (spd < 29) return 'Moderate breeze';
    if (spd < 39) return 'Fresh breeze';
    if (spd < 50) return 'Strong breeze';
    if (spd < 62) return 'Near gale';
    if (spd < 75) return 'Gale';
    if (spd < 89) return 'Strong gale';
    if (spd < 103) return 'Storm';
    return 'Violent storm';
  };

  const pressureHint = (p: number): string => {
    if (p > 1022) return 'High — fair weather likely';
    if (p > 1009) return 'Normal — stable conditions';
    if (p > 995) return 'Low — unsettled weather';
    return 'Very low — stormy conditions';
  };

  const dewPointLabel = (dp: number): string => {
    if (dp < 10) return 'Dry & comfortable';
    if (dp < 15) return 'Comfortable';
    if (dp < 18) return 'Slightly humid';
    if (dp < 21) return 'Quite humid';
    if (dp < 24) return 'Oppressively humid';
    return 'Extremely humid';
  };

  const cloudTypeLabel = (cc: number): string => {
    if (cc < 10) return 'Clear sky';
    if (cc < 30) return 'Few clouds';
    if (cc < 55) return 'Partly cloudy';
    if (cc < 80) return 'Mostly cloudy';
    return 'Overcast';
  };

  const nextHours = hourly
    .filter(h => new Date(h.time) > new Date())
    .slice(0, 6);

  const uvExposureMin = (): string => {
    const idx = current.uvIndex;
    if (idx < 1) return 'No limit';
    if (idx < 3) return '> 60 min';
    if (idx < 6) return '30–60 min';
    if (idx < 8) return '20–30 min';
    if (idx < 11) return '< 20 min';
    return '< 10 min';
  };

  return {
    wind: {
      label: 'WIND',
      value: `${Math.round(current.windSpeed)}`,
      sub: `km/h ${windDegToDirection(current.windDirection)}`,
      color: 'var(--sg-cyan)',
      details: (
        <div className="space-y-3">
          <PRow label="Speed" value={`${Math.round(current.windSpeed)} km/h`} />
          <PRow label="Gusts" value={`${Math.round(current.windGusts)} km/h`} color={current.windGusts > 60 ? 'var(--sg-amber)' : undefined} />
          <PRow label="Direction" value={`${windDegToDirection(current.windDirection)} (${Math.round(current.windDirection)}°)`} />
          <PRow label="Scale" value={beaufort(current.windSpeed)} />
        </div>
      ),
    },
    humidity: {
      label: 'HUMIDITY',
      value: `${Math.round(current.humidity)}%`,
      sub: current.humidity > 80 ? 'very humid' : current.humidity < 30 ? 'dry' : 'comfortable',
      details: (
        <div className="space-y-3">
          <PRow label="Relative" value={`${Math.round(current.humidity)}%`} />
          <PRow label="Dew point" value={`${Math.round(current.dewPoint)}°C`} />
          <PRow label="Comfort" value={dewPointLabel(current.dewPoint)} />
          <MiniBar value={current.humidity} max={100} color="var(--sg-blue)" />
        </div>
      ),
    },
    uv: {
      label: 'UV INDEX',
      value: `${Math.round(current.uvIndex)}`,
      sub: uv.label,
      color: uv.color,
      details: (
        <div className="space-y-3">
          <PRow label="Index" value={`${Math.round(current.uvIndex)}`} color={uv.color} />
          <PRow label="Category" value={uv.label} />
          <PRow label="Safe exposure" value={uvExposureMin()} />
          <PRow label="Today max" value={`${today?.uvIndexMax ?? '—'}`} />
        </div>
      ),
    },
    pressure: {
      label: 'PRESSURE',
      value: `${Math.round(current.pressure)}`,
      sub: 'hPa',
      details: (
        <div className="space-y-3">
          <PRow label="Pressure" value={`${Math.round(current.pressure)} hPa`} />
          <PRow label="Forecast" value={pressureHint(current.pressure)} />
          <PRow label="Standard" value="1013 hPa" color="var(--sg-text-muted)" />
          <MiniBar value={Math.max(0, current.pressure - 960)} max={80} color="var(--sg-magenta)" />
        </div>
      ),
    },
    dewpoint: {
      label: 'DEW PT',
      value: `${Math.round(current.dewPoint)}°`,
      sub: 'Celsius',
      details: (
        <div className="space-y-3">
          <PRow label="Dew point" value={`${Math.round(current.dewPoint)}°C`} />
          <PRow label="Air temp" value={`${Math.round(current.temperature)}°C`} />
          <PRow label="Spread" value={`${(current.temperature - current.dewPoint).toFixed(1)}°C`} />
          <PRow label="Feel" value={dewPointLabel(current.dewPoint)} />
        </div>
      ),
    },
    visibility: {
      label: 'VISIBILITY',
      value: formatVisibility(current.visibility),
      sub: current.visibility >= 10 ? 'clear' : current.visibility >= 5 ? 'good' : 'reduced',
      details: (
        <div className="space-y-3">
          <PRow label="Visibility" value={`${current.visibility.toFixed(1)} km`} />
          <PRow
            label="Quality"
            value={current.visibility >= 20 ? 'Excellent' : current.visibility >= 10 ? 'Good' : current.visibility >= 5 ? 'Moderate' : 'Poor'}
            color={current.visibility >= 10 ? 'var(--sg-green)' : current.visibility >= 5 ? 'var(--sg-amber)' : 'var(--sg-red)'}
          />
          <PRow label="Horizon" value={current.visibility >= 10 ? '≥ 10 km' : `≈ ${current.visibility.toFixed(0)} km`} />
        </div>
      ),
    },
    precip_prob: {
      label: 'RAIN',
      value: `${today?.precipitationProbability ?? 0}%`,
      sub: 'today',
      color: (today?.precipitationProbability ?? 0) > 50 ? 'var(--sg-blue)' : undefined,
      details: (
        <div className="space-y-3">
          <PRow label="Today" value={`${today?.precipitationProbability ?? 0}%`} />
          <PRow label="Total" value={`${(today?.precipitation ?? 0).toFixed(1)} mm`} />
          {nextHours.length > 0 && (
            <div>
              <div className="sg-label mb-2">NEXT 6H</div>
              <div className="flex gap-1.5 items-end" style={{ height: '36px' }}>
                {nextHours.map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{
                    height: `${Math.max(3, (h.precipitationProbability / 100) * 36)}px`,
                    background: `rgba(77,124,255,${0.3 + (h.precipitationProbability / 100) * 0.7})`,
                    minWidth: '10px',
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    cloud_cover: {
      label: 'CLOUDS',
      value: `${Math.round(current.cloudCover)}%`,
      sub: current.cloudCover > 80 ? 'overcast' : current.cloudCover > 40 ? 'partly' : 'clear',
      details: (
        <div className="space-y-3">
          <PRow label="Cover" value={`${Math.round(current.cloudCover)}%`} />
          <PRow label="Type" value={cloudTypeLabel(current.cloudCover)} />
          <PRow label="Solar block" value={`≈ ${Math.round(current.cloudCover * 0.7)}%`} />
          <MiniBar value={current.cloudCover} max={100} color="var(--sg-text-secondary)" />
        </div>
      ),
    },
    sunrise_sunset: {
      label: 'SUNRISE',
      value: formatTime(sun.sunrise).replace(' ', '\u00a0'),
      sub: `↓ ${formatTime(sun.sunset)}`,
      color: '#ffb800',
      details: (
        <div className="space-y-3">
          <PRow label="Sunrise" value={formatTime(sun.sunrise)} color="#ffb800" />
          <PRow label="Sunset" value={formatTime(sun.sunset)} color="#ff6600" />
          <PRow label="Solar noon" value={formatTime(sun.solarNoon)} color="#ffff00" />
          <PRow label="Day length" value={`${Math.floor(sun.dayLength / 60)}h ${sun.dayLength % 60}m`} />
          <PRow label="Golden AM ends" value={formatTime(sun.goldenHourMorningEnd)} color="#ffbb44" />
          <PRow label="Golden PM starts" value={formatTime(sun.goldenHourEveningStart)} color="#ff8833" />
        </div>
      ),
    },
  };
}

// ──────────────────────────────────────────────────────────
//  Individual hero widget tile — taps open the popover
// ──────────────────────────────────────────────────────────
function HeroWidget({
  def,
  isActive,
  onTap,
  sheenDelay,
  entranceIndex,
}: {
  def: WidgetDef;
  isActive: boolean;
  onTap: () => void;
  sheenDelay: string;
  entranceIndex: number;
}) {
  const delay = entranceIndex * 55; // ms stagger between tiles

  return (
    <div
      className="sg-widget-shiny flex flex-col rounded-lg"
      style={{
        background: isActive ? 'rgba(0,255,242,0.08)' : 'rgba(0,255,242,0.04)',
        border: `1px solid rgba(0,255,242,${isActive ? 0.4 : 0.1})`,
        minHeight: '72px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
        boxShadow: isActive ? '0 0 0 1px rgba(0,255,242,0.2), 0 0 16px rgba(0,255,242,0.12)' : undefined,
        '--sheen-delay': sheenDelay,
        // Staggered entrance, then persistent border pulse; active overrides with glow pulse
        animationName: isActive
          ? 'sg-light-pulse'
          : 'sg-fade-in, sg-widget-alive',
        animationDuration: isActive ? '3s' : '0.35s, 5s',
        animationTimingFunction: isActive ? 'ease-in-out' : 'ease-out, ease-in-out',
        animationDelay: isActive ? '0s' : `${delay}ms, ${delay + 420}ms`,
        animationIterationCount: isActive ? 'infinite' : '1, infinite',
        animationFillMode: isActive ? 'none' : 'backwards, none',
      } as React.CSSProperties}
      onClick={onTap}
      role="button"
      tabIndex={0}
      aria-expanded={isActive}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } }}
    >
      <div className="flex flex-col justify-between px-3 py-2.5 h-full">
        <div className="flex items-center justify-between">
          <span className="sg-label leading-none">{def.label}</span>
          <svg
            width="8" height="8" viewBox="0 0 8 8" fill="none"
            style={{
              color: isActive ? 'var(--sg-cyan)' : 'var(--sg-text-muted)',
              transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease, color 0.2s ease',
              flexShrink: 0,
            }}
          >
            <path d="M1.5 2.5L4 5L6.5 2.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <span
            key={def.value}
            className="sg-mono font-semibold leading-tight block mt-1 sg-animate-metric-in"
            style={{ fontSize: '0.92rem', color: def.color ?? 'var(--sg-text-primary)' }}
          >
            {def.value}
          </span>
          {def.sub && (
            <span className="sg-label leading-none mt-0.5 block" style={{ fontSize: '0.6rem' }}>
              {def.sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
//  Widget detail popover — floating bottom sheet overlay
// ──────────────────────────────────────────────────────────
function WidgetPopover({
  def,
  onClose,
}: {
  def: WidgetDef;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}
        aria-hidden
      />
      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 sg-animate-slide-up"
        style={{
          background: 'rgba(8,10,28,0.98)',
          border: '1px solid rgba(0,255,242,0.28)',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -8px 40px rgba(0,255,242,0.12), 0 -2px 20px rgba(0,0,0,0.7)',
        }}
      >
        {/* Drag handle */}
        <div
          className="mx-auto mb-5 rounded-full"
          style={{ width: '40px', height: '4px', background: 'rgba(0,255,242,0.2)' }}
        />

        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="sg-label mb-1.5" style={{ fontSize: '0.65rem' }}>{def.label}</div>
            <div
              className="sg-mono font-bold"
              style={{ fontSize: '2.4rem', lineHeight: 1, color: def.color ?? 'var(--sg-text-primary)' }}
            >
              {def.value}
            </div>
            {def.sub && (
              <div className="sg-label mt-1.5" style={{ fontSize: '0.65rem' }}>{def.sub}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ml-4 active:opacity-70"
            style={{ border: '1px solid rgba(0,255,242,0.2)', color: 'var(--sg-text-muted)' }}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(0,255,242,0.12)', marginBottom: '20px' }} />

        {/* Detail content */}
        {def.details}
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────
//  Sub-components
// ──────────────────────────────────────────────────────────

/** Detail row used inside the popover — larger text for readability */
function PRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="sg-label" style={{ fontSize: '0.68rem', flexShrink: 0 }}>{label}</span>
      <span
        className="sg-mono"
        style={{ fontSize: '0.85rem', color: color ?? 'var(--sg-text-primary)', textAlign: 'right' }}
      >
        {value}
      </span>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="px-4 pt-safe-top pb-2 space-y-3">
      <div className="flex justify-between">
        <div className="sg-skeleton h-5 w-32 rounded" />
        <div className="sg-skeleton h-5 w-20 rounded" />
      </div>
      <div className="sg-skeleton h-20 w-40 rounded" />
      <div className="sg-skeleton h-4 w-24 rounded" />
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[0,1,2].map(i => <div key={i} className="sg-skeleton h-[72px] rounded-lg" />)}
      </div>
    </div>
  );
}

function LocationPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
      <path
        d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z"
        stroke="var(--sg-cyan)" strokeWidth={1.2} fill="none"
        style={{ filter: 'drop-shadow(0 0 3px var(--sg-cyan))' }}
      />
      <circle cx="7" cy="5" r="1.2" fill="var(--sg-cyan)" />
    </svg>
  );
}
