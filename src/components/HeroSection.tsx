'use client';

import { useState, useEffect, useRef } from 'react';
import { WeatherIcon } from '@/components/ui/WeatherIcon';
import { CompassRose } from '@/components/ui/CompassRose';
import { ArcGauge } from '@/components/ui/ArcGauge';
import { SunArc } from '@/components/ui/SunArc';
import { Sparkline } from '@/components/ui/Sparkline';
import {
  formatTemp, formatTime, formatRelativeTime, wmoLabel,
  uvCategory, windDegToDirection, formatVisibility,
} from '@/lib/formatters';
import type { WeatherData } from '@/types/weather';
import type { ExtraData } from '@/types/extra';
import type { HeroWidgetId } from '@/hooks/useHeroPreferences';

interface HeroSectionProps {
  data: WeatherData | null;
  loading: boolean;
  isStale: boolean;
  lastUpdated: string | null;
  onLocationTap: () => void;
  onCustomize: () => void;
  enabledWidgets: Set<HeroWidgetId>;
  extraData?: ExtraData | null;
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
  extraData,
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
    'marine', 'kp_index', 'earthquake', 'flights',
  ];
  const activeWidgets = widgetOrder.filter(id => enabledWidgets.has(id));
  const defs = buildWidgetDefs(data, extraData);

  const handleWidgetTap = (id: HeroWidgetId) => {
    setExpandedWidget(prev => (prev === id ? null : id));
  };

  return (
    <div className="relative px-4 pt-safe-top pb-2 sg-animate-fade-in">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none sg-animate-light-pulse"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(92, 224, 214,0.07) 0%, transparent 70%)', borderRadius: '0 0 40% 40%' }}
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
            style={{ border: '1px solid rgba(92, 224, 214,0.2)', color: 'var(--sg-text-muted)' }}
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
              background: 'rgba(232, 168, 48,0.1)',
              border: '1px solid rgba(232, 168, 48,0.35)',
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
  tileBar?: { pct: number; color: string };
  details: React.ReactNode;
};

function buildWidgetDefs(data: WeatherData, extra?: ExtraData | null): Record<HeroWidgetId, WidgetDef> {
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
      tileBar: { pct: Math.min(100, (current.windSpeed / 100) * 100), color: 'var(--sg-cyan)' },
      details: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <CompassRose degrees={current.windDirection} size={96} />
            <div className="flex-1 space-y-2.5">
              <PRow label="Speed" value={`${Math.round(current.windSpeed)} km/h`} />
              <PRow label="Gusts" value={`${Math.round(current.windGusts)} km/h`} color={current.windGusts > 60 ? 'var(--sg-amber)' : undefined} />
              <PRow label="Direction" value={`${windDegToDirection(current.windDirection)} (${Math.round(current.windDirection)}°)`} />
            </div>
          </div>
          <BeaufortBar speed={current.windSpeed} />
          {nextHours.length >= 2 && (
            <div>
              <div className="sg-label mb-1.5">6H WIND TREND</div>
              <Sparkline data={nextHours.map(h => h.windSpeed)} width={260} height={36} color="var(--sg-cyan)" fillColor="rgba(92, 224, 214,0.08)" />
            </div>
          )}
        </div>
      ),
    },
    humidity: {
      label: 'HUMIDITY',
      value: `${Math.round(current.humidity)}%`,
      sub: current.humidity > 80 ? 'very humid' : current.humidity < 30 ? 'dry' : 'comfortable',
      tileBar: { pct: current.humidity, color: 'var(--sg-blue)' },
      details: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <ArcGauge value={current.humidity} size={96} color="var(--sg-blue)" label="RH" unit="%" />
            <div className="flex-1 space-y-2.5">
              <PRow label="Relative" value={`${Math.round(current.humidity)}%`} />
              <PRow label="Dew point" value={`${Math.round(current.dewPoint)}°C`} />
              <PRow label="Comfort" value={dewPointLabel(current.dewPoint)} />
            </div>
          </div>
          {nextHours.length >= 2 && (
            <div>
              <div className="sg-label mb-1.5">6H HUMIDITY TREND</div>
              <Sparkline data={nextHours.map(h => h.humidity)} width={260} height={36} color="var(--sg-blue)" fillColor="rgba(107, 140, 255,0.08)" />
            </div>
          )}
        </div>
      ),
    },
    uv: {
      label: 'UV INDEX',
      value: `${Math.round(current.uvIndex)}`,
      sub: uv.label,
      color: uv.color,
      tileBar: { pct: Math.min(100, (current.uvIndex / 12) * 100), color: uv.color },
      details: (
        <div className="space-y-4">
          <UVScaleBar index={current.uvIndex} />
          <div className="space-y-2.5">
            <PRow label="Index" value={`${Math.round(current.uvIndex)}`} color={uv.color} />
            <PRow label="Category" value={uv.label} />
            <PRow label="Safe exposure" value={uvExposureMin()} />
            <PRow label="Today max" value={`${today?.uvIndexMax ?? '—'}`} />
          </div>
          {nextHours.length >= 2 && (
            <div>
              <div className="sg-label mb-1.5">6H UV TREND</div>
              <Sparkline data={nextHours.map(h => h.uvIndex)} width={260} height={36} color={uv.color} fillColor={`${uv.color}18`} />
            </div>
          )}
        </div>
      ),
    },
    pressure: {
      label: 'PRESSURE',
      value: `${Math.round(current.pressure)}`,
      sub: 'hPa',
      tileBar: { pct: Math.min(100, Math.max(0, (current.pressure - 960) / 80) * 100), color: 'var(--sg-magenta)' },
      details: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <PressureArc pressure={current.pressure} size={96} />
            <div className="flex-1 space-y-2.5">
              <PRow label="Pressure" value={`${Math.round(current.pressure)} hPa`} />
              <PRow label="Standard" value="1013 hPa" color="var(--sg-text-muted)" />
              <PRow label="Deviation" value={`${current.pressure > 1013 ? '+' : ''}${Math.round(current.pressure - 1013)} hPa`} color={current.pressure > 1022 ? 'var(--sg-green)' : current.pressure < 995 ? 'var(--sg-amber)' : undefined} />
            </div>
          </div>
          <div className="px-2 py-2 rounded-lg text-xs sg-mono" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--sg-text-secondary)' }}>
            {pressureHint(current.pressure)}
          </div>
          {nextHours.length >= 2 && (
            <div>
              <div className="sg-label mb-1.5">6H PRESSURE TREND</div>
              <Sparkline data={nextHours.map(h => h.pressure)} width={260} height={36} color="var(--sg-magenta)" fillColor="rgba(255,0,200,0.08)" />
            </div>
          )}
        </div>
      ),
    },
    dewpoint: {
      label: 'DEW PT',
      value: `${Math.round(current.dewPoint)}°`,
      sub: 'Celsius',
      tileBar: { pct: Math.min(100, Math.max(0, ((current.dewPoint + 10) / 40) * 100)), color: 'var(--sg-blue)' },
      details: (
        <div className="space-y-4">
          <DewComfortBar dewPoint={current.dewPoint} />
          <div className="space-y-2.5">
            <PRow label="Dew point" value={`${Math.round(current.dewPoint)}°C`} />
            <PRow label="Air temp" value={`${Math.round(current.temperature)}°C`} />
            <PRow label="Spread" value={`${(current.temperature - current.dewPoint).toFixed(1)}°C`} />
            <PRow label="Feel" value={dewPointLabel(current.dewPoint)} />
          </div>
        </div>
      ),
    },
    visibility: {
      label: 'VISIBILITY',
      value: formatVisibility(current.visibility),
      sub: current.visibility >= 10 ? 'clear' : current.visibility >= 5 ? 'good' : 'reduced',
      tileBar: { pct: Math.min(100, (current.visibility / 20) * 100), color: 'var(--sg-green)' },
      details: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <HorizonRings visibility={current.visibility} size={96} />
            <div className="flex-1 space-y-2.5">
              <PRow label="Distance" value={`${current.visibility.toFixed(1)} km`} />
              <PRow
                label="Quality"
                value={current.visibility >= 20 ? 'Excellent' : current.visibility >= 10 ? 'Good' : current.visibility >= 5 ? 'Moderate' : 'Poor'}
                color={current.visibility >= 10 ? 'var(--sg-green)' : current.visibility >= 5 ? 'var(--sg-amber)' : 'var(--sg-red)'}
              />
              <PRow label="Horizon" value={current.visibility >= 10 ? '≥ 10 km' : `≈ ${current.visibility.toFixed(0)} km`} />
            </div>
          </div>
        </div>
      ),
    },
    precip_prob: {
      label: 'RAIN',
      value: `${today?.precipitationProbability ?? 0}%`,
      sub: 'today',
      color: (today?.precipitationProbability ?? 0) > 50 ? 'var(--sg-blue)' : undefined,
      tileBar: { pct: today?.precipitationProbability ?? 0, color: 'var(--sg-blue)' },
      details: (
        <div className="space-y-4">
          <div className="space-y-2.5">
            <PRow label="Today probability" value={`${today?.precipitationProbability ?? 0}%`} />
            <PRow label="Today total" value={`${(today?.precipitation ?? 0).toFixed(1)} mm`} />
            <PRow label="Current" value={current.precipitation > 0 ? `${current.precipitation.toFixed(1)} mm/h` : 'Dry'} color={current.precipitation > 0 ? 'var(--sg-blue)' : undefined} />
          </div>
          {nextHours.length > 0 && (
            <div>
              <div className="sg-label mb-2">NEXT 6H PROBABILITY</div>
              <div className="flex gap-1.5 items-end" style={{ height: '40px' }}>
                {nextHours.map((h, i) => {
                  const pct = h.precipitationProbability / 100;
                  const barH = Math.max(3, pct * 40);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full rounded-sm" style={{
                        height: `${barH}px`,
                        background: `rgba(107, 140, 255,${0.25 + pct * 0.75})`,
                        boxShadow: pct > 0.5 ? '0 0 4px rgba(107, 140, 255,0.5)' : undefined,
                      }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1.5 mt-1">
                {nextHours.map((h, i) => (
                  <div key={i} className="flex-1 text-center sg-label" style={{ fontSize: '0.5rem' }}>
                    {new Date(h.time).getHours()}h
                  </div>
                ))}
              </div>
            </div>
          )}
          {(today?.precipitationProbability ?? 0) > 30 && <RainDrops />}
        </div>
      ),
    },
    cloud_cover: {
      label: 'CLOUDS',
      value: `${Math.round(current.cloudCover)}%`,
      sub: current.cloudCover > 80 ? 'overcast' : current.cloudCover > 40 ? 'partly' : 'clear',
      tileBar: { pct: current.cloudCover, color: 'var(--sg-text-secondary)' },
      details: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <SkyDisc cover={current.cloudCover} size={96} />
            <div className="flex-1 space-y-2.5">
              <PRow label="Cover" value={`${Math.round(current.cloudCover)}%`} />
              <PRow label="Type" value={cloudTypeLabel(current.cloudCover)} />
              <PRow label="Solar block" value={`≈ ${Math.round(current.cloudCover * 0.7)}%`} />
            </div>
          </div>
          {nextHours.length >= 2 && (
            <div>
              <div className="sg-label mb-1.5">6H CLOUD TREND</div>
              <Sparkline data={nextHours.map(h => h.precipitationProbability)} width={260} height={36} color="rgba(150,150,180,0.8)" fillColor="rgba(150,150,180,0.06)" />
            </div>
          )}
        </div>
      ),
    },
    sunrise_sunset: {
      label: 'SUNRISE',
      value: formatTime(sun.sunrise).replace(' ', '\u00a0'),
      sub: `↓ ${formatTime(sun.sunset)}`,
      color: '#e8a830',
      tileBar: { pct: Math.max(0, Math.min(100, sun.currentPosition * 100)), color: '#e8a830' },
      details: (
        <div className="space-y-4">
          <SunArc
            sunrise={sun.sunrise}
            sunset={sun.sunset}
            position={sun.currentPosition}
            goldenHourMorningEnd={sun.goldenHourMorningEnd}
            goldenHourEveningStart={sun.goldenHourEveningStart}
            solarNoon={sun.solarNoon}
            width={280}
            height={120}
          />
          <div className="space-y-2">
            <PRow label="Sunrise" value={formatTime(sun.sunrise)} color="#e8a830" />
            <PRow label="Sunset" value={formatTime(sun.sunset)} color="#ff6600" />
            <PRow label="Solar noon" value={formatTime(sun.solarNoon)} color="#ffff00" />
            <PRow label="Day length" value={`${Math.floor(sun.dayLength / 60)}h ${sun.dayLength % 60}m`} />
            <PRow label="Golden AM ends" value={formatTime(sun.goldenHourMorningEnd)} color="#ffbb44" />
            <PRow label="Golden PM starts" value={formatTime(sun.goldenHourEveningStart)} color="#ff8833" />
          </div>
        </div>
      ),
    },

    // ── Live feed widgets ──────────────────────────────────
    marine: (() => {
      const m = extra?.marine;
      const ready = m && m.available;
      const waveH = ready ? (m.waveHeight ?? 0) : 0;
      return {
        label: 'MARINE',
        value: ready ? `${m.waveHeight?.toFixed(1)}m` : '—',
        sub: ready && m.swellDirection != null
          ? `${windDegToDirection(m.swellDirection)} · ${m.wavePeriod?.toFixed(0)}s`
          : 'no ocean data',
        color: 'var(--sg-blue)',
        tileBar: { pct: ready ? Math.min(100, (waveH / 6) * 100) : 0, color: 'var(--sg-blue)' },
        details: ready ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {m.waveDirection != null && <CompassRose degrees={m.waveDirection} size={88} color="var(--sg-blue)" />}
              <div className="flex-1 space-y-2.5">
                <PRow label="Wave height" value={`${m.waveHeight?.toFixed(1)} m`} color="var(--sg-blue)" />
                <PRow label="Wave period" value={`${m.wavePeriod?.toFixed(1)} s`} />
                <PRow label="Wave from" value={m.waveDirection != null ? `${windDegToDirection(m.waveDirection)} (${Math.round(m.waveDirection)}°)` : '—'} />
              </div>
            </div>
            <div className="space-y-2.5">
              <PRow label="Swell height" value={`${m.swellHeight?.toFixed(1)} m`} />
              <PRow label="Swell period" value={`${m.swellPeriod?.toFixed(1)} s`} />
              {m.swellDirection != null && (
                <PRow label="Swell from" value={`${windDegToDirection(m.swellDirection)} (${Math.round(m.swellDirection)}°)`} />
              )}
            </div>
          </div>
        ) : <div className="sg-label">No marine data for this location.</div>,
      };
    })(),

    kp_index: (() => {
      const sw = extra?.spaceWeather;
      const auroraLabel = sw
        ? { none: 'No aurora', low: 'Low aurora', possible: 'Possible', likely: 'Likely', high: 'High aurora' }[sw.auroraChance]
        : '—';
      const kpColor = sw ? (sw.kpIndex < 3 ? 'var(--sg-cyan)' : sw.kpIndex < 5 ? 'var(--sg-amber)' : 'var(--sg-red)') : 'var(--sg-cyan)';
      return {
        label: 'KP INDEX',
        value: sw ? `${sw.kpIndex.toFixed(1)}` : '—',
        sub: sw ? sw.kpLabel : 'loading…',
        color: kpColor,
        tileBar: { pct: sw ? Math.min(100, (sw.kpIndex / 9) * 100) : 0, color: kpColor },
        details: sw ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ArcGauge value={Math.min(100, (sw.kpIndex / 9) * 100)} size={96} color={kpColor} label="Kp" unit="" />
              <div className="flex-1 space-y-2.5">
                <PRow label="Kp index" value={sw.kpIndex.toFixed(1)} color={kpColor} />
                <PRow label="Activity" value={sw.kpLabel} />
                <PRow label="Aurora" value={auroraLabel} color={sw.kpIndex >= 5 ? 'var(--sg-green)' : undefined} />
              </div>
            </div>
            {sw.history.length >= 2 && (
              <div>
                <div className="sg-label mb-1.5">24H Kp HISTORY</div>
                <Sparkline data={sw.history.map(h => h.kp)} width={260} height={36} color={kpColor} fillColor={`${kpColor}15`} />
              </div>
            )}
          </div>
        ) : <div className="sg-label">Space weather data loading…</div>,
      };
    })(),

    earthquake: (() => {
      const quakes = extra?.earthquakes ?? [];
      const top = quakes[0];
      const topMag = top?.magnitude ?? 0;
      const topColor = topMag >= 5 ? 'var(--sg-red)' : topMag >= 4 ? 'var(--sg-amber)' : 'var(--sg-green)';
      return {
        label: 'SEISMIC',
        value: top ? `M${top.magnitude.toFixed(1)}` : '—',
        sub: top ? `${top.distanceKm} km away` : quakes.length === 0 && extra ? 'none nearby' : 'loading…',
        color: top ? topColor : undefined,
        tileBar: { pct: top ? Math.min(100, (topMag / 8) * 100) : 0, color: top ? topColor : 'var(--sg-green)' },
        details: quakes.length > 0 ? (
          <div className="space-y-3">
            {quakes.slice(0, 5).map(q => {
              const c = q.magnitude >= 5 ? 'var(--sg-red)' : q.magnitude >= 4 ? 'var(--sg-amber)' : 'var(--sg-green)';
              return (
                <div key={q.id} className="flex items-start gap-3">
                  <div
                    className="sg-mono font-bold text-xs flex-shrink-0 mt-0.5 w-12 text-center py-0.5 rounded"
                    style={{ color: c, border: `1px solid ${c}40`, background: `${c}10` }}
                  >
                    M{q.magnitude.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="sg-mono text-xs" style={{ color: 'var(--sg-text-primary)' }}>
                      {q.distanceKm} km · {q.depth} km deep
                    </div>
                    <div className="sg-label truncate mt-0.5" style={{ fontSize: '0.58rem' }}>{q.place}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <div className="sg-label">No significant seismic activity nearby.</div>,
      };
    })(),

    flights: (() => {
      const fl = extra?.flights;
      const top = fl?.flights[0];
      return {
        label: 'FLIGHTS',
        value: fl ? `${fl.count}` : '—',
        sub: top ? `${top.callsign.trim()} overhead` : fl ? 'none overhead' : 'loading…',
        color: 'var(--sg-cyan)',
        tileBar: { pct: fl ? Math.min(100, (fl.count / 20) * 100) : 0, color: 'var(--sg-cyan)' },
        details: fl && fl.count > 0 ? (
          <div className="space-y-3">
            <PRow label="Aircraft overhead" value={`${fl.count}`} color="var(--sg-cyan)" />
            <div className="space-y-2 mt-1">
              {fl.flights.slice(0, 6).map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="sg-mono text-xs font-bold flex-shrink-0 w-16 text-center py-0.5 rounded"
                    style={{ color: 'var(--sg-cyan)', border: '1px solid rgba(92, 224, 214,0.2)', background: 'rgba(92, 224, 214,0.06)' }}
                  >
                    {f.callsign.trim() || '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="sg-mono text-xs" style={{ color: 'var(--sg-text-primary)' }}>
                      {Math.round((f.altitude * 3.28084) / 1000)}k ft · {Math.round(f.velocity)} km/h
                    </div>
                    <div className="sg-label" style={{ fontSize: '0.58rem' }}>{f.originCountry}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : <div className="sg-label">{fl ? 'No aircraft currently overhead.' : 'Flight data loading…'}</div>,
      };
    })(),
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
        position: 'relative',
        background: isActive ? 'rgba(92, 224, 214,0.08)' : 'rgba(92, 224, 214,0.04)',
        border: `1px solid rgba(92, 224, 214,${isActive ? 0.4 : 0.1})`,
        minHeight: '72px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
        boxShadow: isActive ? '0 0 0 1px rgba(92, 224, 214,0.2), 0 0 16px rgba(92, 224, 214,0.12)' : undefined,
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
      {def.tileBar && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-b-lg"
            style={{
              width: `${Math.max(0, Math.min(100, def.tileBar.pct))}%`,
              background: def.tileBar.color,
              boxShadow: `0 0 4px ${def.tileBar.color}`,
              transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
      )}
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
          border: '1px solid rgba(92, 224, 214,0.28)',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -8px 40px rgba(92, 224, 214,0.12), 0 -2px 20px rgba(0,0,0,0.7)',
        }}
      >
        {/* Drag handle */}
        <div
          className="mx-auto mb-5 rounded-full"
          style={{ width: '40px', height: '4px', background: 'rgba(92, 224, 214,0.2)' }}
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
            style={{ border: '1px solid rgba(92, 224, 214,0.2)', color: 'var(--sg-text-muted)' }}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(92, 224, 214,0.12)', marginBottom: '20px' }} />

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

// ──────────────────────────────────────────────────────────
//  Visual helper components used in widget popovers
// ──────────────────────────────────────────────────────────

/** Beaufort wind scale segmented bar — 12 segments colour-coded by intensity */
function BeaufortBar({ speed }: { speed: number }) {
  const segments = [
    { max: 1, label: 'Calm', color: '#4df7c8' },
    { max: 6, label: 'Light air', color: '#4df0b0' },
    { max: 12, label: 'Lt breeze', color: '#4de880' },
    { max: 20, label: 'Gnt breeze', color: '#a0e030' },
    { max: 29, label: 'Mod breeze', color: '#d4c820' },
    { max: 39, label: 'Fsh breeze', color: '#f0a020' },
    { max: 50, label: 'Str breeze', color: '#e87020' },
    { max: 62, label: 'Near gale', color: '#e04020' },
    { max: 75, label: 'Gale', color: '#d02020' },
    { max: 89, label: 'Str gale', color: '#c01060' },
    { max: 103, label: 'Storm', color: '#b000b0' },
    { max: 120, label: 'Violent', color: '#8000ff' },
  ];
  const active = segments.findIndex((s, i) =>
    speed < s.max || i === segments.length - 1
  );
  return (
    <div>
      <div className="sg-label mb-1.5">BEAUFORT SCALE</div>
      <div className="flex gap-0.5 h-5">
        {segments.map((s, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              background: i <= active ? s.color : 'rgba(255,255,255,0.07)',
              boxShadow: i === active ? `0 0 6px ${s.color}` : undefined,
            }}
          />
        ))}
      </div>
      <div className="sg-label mt-1" style={{ fontSize: '0.58rem' }}>
        {segments[active].label} · {Math.round(speed)} km/h
      </div>
    </div>
  );
}

/** UV index gradient scale bar with a needle */
function UVScaleBar({ index }: { index: number }) {
  const pct = Math.min(100, (index / 12) * 100);
  const label =
    index < 3 ? 'Low' : index < 6 ? 'Moderate' : index < 8 ? 'High' : index < 11 ? 'Very High' : 'Extreme';
  const zones = [
    { label: 'Low', end: 25, color: '#4ade80' },
    { label: 'Mod', end: 50, color: '#facc15' },
    { label: 'High', end: 67, color: '#fb923c' },
    { label: 'V.Hi', end: 92, color: '#f87171' },
    { label: 'Extr', end: 100, color: '#c084fc' },
  ];
  return (
    <div>
      <div className="sg-label mb-1.5">UV SCALE</div>
      <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #4ade80, #facc15, #fb923c, #f87171, #c084fc)' }}>
        <div
          className="absolute top-0 bottom-0 w-0.5 rounded-full bg-white"
          style={{ left: `${pct}%`, boxShadow: '0 0 6px white', transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {zones.map(z => (
          <div key={z.label} className="sg-label" style={{ fontSize: '0.52rem', color: z.color }}>{z.label}</div>
        ))}
      </div>
      <div className="sg-label mt-1" style={{ fontSize: '0.58rem' }}>
        UV {Math.round(index)} — {label}
      </div>
    </div>
  );
}

/** Pressure arc gauge (like a barometer dial) */
function PressureArc({ pressure, size }: { pressure: number; size: number }) {
  // Range 960-1040, needle sweeps from -210° to 30° (240° total)
  const pct = Math.min(1, Math.max(0, (pressure - 960) / 80));
  const color =
    pressure > 1022 ? 'var(--sg-green)' : pressure > 1009 ? 'var(--sg-cyan)' : pressure > 995 ? 'var(--sg-amber)' : 'var(--sg-red)';
  return (
    <div className="flex flex-col items-center" style={{ width: size, height: size }}>
      <ArcGauge
        value={pct * 100}
        size={size}
        color={color}
        label={`${Math.round(pressure)}`}
        unit="hPa"
        strokeWidth={5}
      />
    </div>
  );
}

/** Dew point comfort bar — colour gradient zones with marker */
function DewComfortBar({ dewPoint }: { dewPoint: number }) {
  // Zones: Dry (<10), Comfortable (10–15), Slightly humid (15–18), Quite humid (18–21), Oppressive (21–24), Extreme (>24)
  const zones = [
    { label: 'Dry', color: '#94a3b8', range: '< 10°' },
    { label: 'Comf', color: '#4ade80', range: '10–15°' },
    { label: 'Sl.Hm', color: '#a3e635', range: '15–18°' },
    { label: 'Humid', color: '#facc15', range: '18–21°' },
    { label: 'Opprs', color: '#fb923c', range: '21–24°' },
    { label: 'Extm', color: '#f87171', range: '> 24°' },
  ];
  const activeZone =
    dewPoint < 10 ? 0 : dewPoint < 15 ? 1 : dewPoint < 18 ? 2 : dewPoint < 21 ? 3 : dewPoint < 24 ? 4 : 5;
  return (
    <div>
      <div className="sg-label mb-1.5">DEW POINT COMFORT</div>
      <div className="flex gap-0.5 h-4">
        {zones.map((z, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              background: z.color,
              opacity: i === activeZone ? 1 : 0.22,
              boxShadow: i === activeZone ? `0 0 6px ${z.color}` : undefined,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {zones.map((z, i) => (
          <div key={i} className="sg-label" style={{ fontSize: '0.48rem', color: i === activeZone ? z.color : 'var(--sg-text-muted)' }}>
            {z.label}
          </div>
        ))}
      </div>
      <div className="sg-label mt-1" style={{ fontSize: '0.58rem', color: zones[activeZone].color }}>
        {zones[activeZone].label} · {dewPoint.toFixed(1)}°C
      </div>
    </div>
  );
}

/** Horizon rings showing visibility as concentric circles */
function HorizonRings({ visibility, size }: { visibility: number; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxKm = 20;
  const radii = [5, 10, 15, 20];
  const visColor = visibility >= 10 ? 'var(--sg-green)' : visibility >= 5 ? 'var(--sg-amber)' : 'var(--sg-red)';
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {radii.map(km => {
        const r = ((km / maxKm) * (size / 2 - 6));
        const isVisible = visibility >= km;
        return (
          <circle
            key={km}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={isVisible ? visColor : 'rgba(255,255,255,0.07)'}
            strokeWidth={isVisible ? 1.5 : 1}
            strokeDasharray={isVisible ? undefined : '3 3'}
            style={{ opacity: isVisible ? 0.6 + (km / maxKm) * 0.4 : 0.25 }}
          />
        );
      })}
      {/* viewer dot */}
      <circle cx={cx} cy={cy} r={3} fill={visColor} style={{ filter: `drop-shadow(0 0 3px ${visColor})` }} />
      {/* visibility reach ring */}
      <circle
        cx={cx} cy={cy}
        r={Math.min((visibility / maxKm) * (size / 2 - 6), size / 2 - 6)}
        fill="none"
        stroke={visColor}
        strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 4px ${visColor})` }}
      />
      <text x={cx} y={size - 4} textAnchor="middle" fontSize="8" fill="var(--sg-text-muted)" fontFamily="monospace">
        {visibility.toFixed(0)} km
      </text>
    </svg>
  );
}

/** Sky disc SVG showing cloud coverage as a filled circle */
function SkyDisc({ cover, size }: { cover: number; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 5;
  // Cloud fill: clip the bottom portion of the disc
  const fillH = (cover / 100) * (r * 2);
  const fillY = cy + r - fillH;
  const cloudColor = cover > 80 ? 'rgba(150,150,200,0.7)' : cover > 40 ? 'rgba(150,150,200,0.5)' : 'rgba(150,150,200,0.25)';
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <defs>
        <clipPath id={`sky-clip-${size}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      {/* Sky background */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(30,50,120,0.4)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      {/* Cloud fill — rises from bottom */}
      <rect
        x={cx - r}
        y={fillY}
        width={r * 2}
        height={fillH}
        fill={cloudColor}
        clipPath={`url(#sky-clip-${size})`}
      />
      {/* Sun glow (visible when clear) */}
      {cover < 40 && (
        <circle cx={cx} cy={cy - r * 0.35} r={r * 0.22} fill="#ffcc00" style={{ opacity: 1 - cover / 100, filter: 'blur(2px) drop-shadow(0 0 4px #ffcc00)' }} />
      )}
      <text x={cx} y={cy + r + 12} textAnchor="middle" fontSize="8" fill="var(--sg-text-muted)" fontFamily="monospace">
        {Math.round(cover)}%
      </text>
    </svg>
  );
}

/** CSS animated rain drops (decorative) */
function RainDrops() {
  return (
    <>
      <style>{`
        @keyframes sg-raindrop {
          0%   { transform: translateY(-8px); opacity: 0; }
          20%  { opacity: 0.8; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(32px); opacity: 0; }
        }
      `}</style>
      <div className="relative overflow-hidden rounded-lg" style={{ height: '32px', background: 'rgba(107, 140, 255,0.06)', border: '1px solid rgba(107, 140, 255,0.15)' }}>
        {[10, 25, 40, 55, 70, 85].map((left, i) => (
          <div
            key={i}
            className="absolute w-0.5 rounded-full"
            style={{
              left: `${left}%`,
              top: '0',
              height: '8px',
              background: 'rgba(107, 140, 255,0.7)',
              animation: `sg-raindrop ${0.7 + i * 0.15}s linear infinite`,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center sg-label" style={{ fontSize: '0.58rem', color: 'var(--sg-blue)' }}>
          RAIN LIKELY
        </div>
      </div>
    </>
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
