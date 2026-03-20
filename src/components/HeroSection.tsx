'use client';

import { WeatherIcon } from '@/components/ui/WeatherIcon';
import { formatTemp, formatTime, formatRelativeTime, wmoLabel, uvCategory, windDegToDirection, formatWindSpeed, formatVisibility } from '@/lib/formatters';
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

  if (loading && !data) return <HeroSkeleton />;
  if (!data) return null;

  const { current, location, daily, sun } = data;
  const today = daily[0];
  const uv = uvCategory(current.uvIndex);
  const hasAlert = current.uvIndex >= 8 || current.windGusts > 80;

  // Build enabled widgets list in display order
  const widgetOrder: HeroWidgetId[] = [
    'wind', 'humidity', 'uv', 'precip_prob', 'pressure',
    'dewpoint', 'visibility', 'cloud_cover', 'sunrise_sunset',
  ];
  const activeWidgets = widgetOrder.filter(id => enabledWidgets.has(id));

  return (
    <div className="relative px-4 pt-safe-top pb-2 sg-animate-fade-in">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,242,0.06) 0%, transparent 70%)' }}
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
          {/* Customize button */}
          <button
            onClick={onCustomize}
            className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-md transition-all active:opacity-70"
            style={{ border: '1px solid rgba(0,255,242,0.2)', color: 'var(--sg-text-muted)' }}
            aria-label="Customise hero dashboard"
            title="Customise"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
          {/* Big temperature */}
          <div className="flex items-start gap-1">
            <span
              className="sg-mono font-bold leading-none sg-glow-cyan"
              style={{ fontSize: 'clamp(3.8rem, 18vw, 5.5rem)', color: 'var(--sg-cyan)' }}
            >
              {Math.round(current.temperature)}
            </span>
            <span
              className="sg-mono font-light mt-2"
              style={{ fontSize: '1.8rem', color: 'var(--sg-cyan-dim)' }}
            >
              °C
            </span>
          </div>

          {/* Feels like */}
          <div className="flex items-center gap-2 -mt-1">
            <span className="sg-label">FEELS</span>
            <span className="sg-mono text-xs text-[var(--sg-text-secondary)]">
              {formatTemp(current.feelsLike)}
            </span>
          </div>

          {/* Condition */}
          <div className="flex items-center gap-2 mt-1.5">
            <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={18} color="#00fff2" />
            <span className="text-sm text-[var(--sg-text-secondary)]">
              {wmoLabel(current.weatherCode)}
            </span>
          </div>
        </div>

        {/* Right column: hi/lo + icon */}
        <div className="flex flex-col items-end gap-2">
          <WeatherIcon
            code={current.weatherCode}
            isDay={current.isDay}
            size={60}
            color="#00fff2"
          />
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

      {/* Customisable widget tiles */}
      {activeWidgets.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {activeWidgets.map(id => (
            <HeroWidget key={id} id={id} data={data} />
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
    </div>
  );
}

// Individual hero widget tile
function HeroWidget({ id, data }: { id: HeroWidgetId; data: WeatherData }) {
  const { current, sun, daily } = data;

  type WidgetDef = { label: string; value: string; sub?: string; color?: string };

  const defs: Record<HeroWidgetId, WidgetDef> = {
    wind: {
      label: 'WIND',
      value: `${Math.round(current.windSpeed)}`,
      sub: `km/h ${windDegToDirection(current.windDirection)}`,
      color: 'var(--sg-cyan)',
    },
    humidity: {
      label: 'HUMIDITY',
      value: `${Math.round(current.humidity)}%`,
      sub: current.humidity > 80 ? 'very humid' : current.humidity < 30 ? 'dry' : 'comfortable',
    },
    uv: {
      label: 'UV INDEX',
      value: `${Math.round(current.uvIndex)}`,
      sub: uvCategory(current.uvIndex).label,
      color: uvCategory(current.uvIndex).color,
    },
    pressure: {
      label: 'PRESSURE',
      value: `${Math.round(current.pressure)}`,
      sub: 'hPa',
    },
    dewpoint: {
      label: 'DEW PT',
      value: `${Math.round(current.dewPoint)}°`,
      sub: 'Celsius',
    },
    visibility: {
      label: 'VISIBILITY',
      value: formatVisibility(current.visibility),
      sub: current.visibility >= 10 ? 'clear' : current.visibility >= 5 ? 'good' : 'reduced',
    },
    precip_prob: {
      label: 'RAIN',
      value: `${daily[0]?.precipitationProbability ?? 0}%`,
      sub: 'today',
      color: daily[0]?.precipitationProbability > 50 ? 'var(--sg-blue)' : undefined,
    },
    cloud_cover: {
      label: 'CLOUDS',
      value: `${Math.round(current.cloudCover)}%`,
      sub: current.cloudCover > 80 ? 'overcast' : current.cloudCover > 40 ? 'partly' : 'clear',
    },
    sunrise_sunset: {
      label: 'SUNRISE',
      value: formatTime(sun.sunrise).replace(' ', '\u00a0'),
      sub: `↓ ${formatTime(sun.sunset)}`,
      color: '#ffb800',
    },
  };

  const def = defs[id];
  if (!def) return null;

  return (
    <div
      className="flex flex-col justify-between px-2.5 py-2 rounded-lg"
      style={{
        background: 'rgba(0,255,242,0.04)',
        border: '1px solid rgba(0,255,242,0.1)',
        minHeight: '56px',
      }}
    >
      <span className="sg-label leading-none">{def.label}</span>
      <span
        className="sg-mono text-sm font-semibold leading-tight mt-1"
        style={{ color: def.color ?? 'var(--sg-text-primary)' }}
      >
        {def.value}
      </span>
      {def.sub && (
        <span className="sg-label leading-none mt-0.5" style={{ fontSize: '0.58rem' }}>
          {def.sub}
        </span>
      )}
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="px-4 pt-safe-top pb-2 space-y-3">
      <div className="flex justify-between">
        <div className="sg-skeleton h-5 w-32 rounded" />
        <div className="sg-skeleton h-5 w-20 rounded" />
      </div>
      <div className="sg-skeleton h-20 w-40 rounded" />
      <div className="sg-skeleton h-4 w-24 rounded" />
      <div className="grid grid-cols-3 gap-1.5 mt-2">
        {[0,1,2].map(i => <div key={i} className="sg-skeleton h-14 rounded-lg" />)}
      </div>
    </div>
  );
}

function LocationPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
      <path
        d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z"
        stroke="#00fff2" strokeWidth={1.2} fill="none"
        style={{ filter: 'drop-shadow(0 0 3px #00fff2)' }}
      />
      <circle cx="7" cy="5" r="1.2" fill="#00fff2" />
    </svg>
  );
}
