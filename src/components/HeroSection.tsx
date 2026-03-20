'use client';

import { WeatherIcon } from '@/components/ui/WeatherIcon';
import { formatTemp, formatTime, formatRelativeTime, wmoLabel, uvCategory } from '@/lib/formatters';
import type { WeatherData } from '@/types/weather';

interface HeroSectionProps {
  data: WeatherData | null;
  loading: boolean;
  isStale: boolean;
  lastUpdated: string | null;
  onLocationTap: () => void;
}

export function HeroSection({ data, loading, isStale, lastUpdated, onLocationTap }: HeroSectionProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (loading && !data) {
    return <HeroSkeleton />;
  }

  if (!data) return null;

  const { current, location, daily } = data;
  const today = daily[0];
  const uv = uvCategory(current.uvIndex);
  const hasAlert = current.uvIndex >= 8 || current.windGusts > 80;

  return (
    <div className="relative px-4 pt-safe-top pb-2 sg-animate-fade-in">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,242,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Top row: location + time */}
      <div className="flex items-start justify-between mb-1 relative">
        <button
          onClick={onLocationTap}
          className="flex items-center gap-1.5 group"
          aria-label="Change location"
        >
          <LocationPinIcon />
          <div>
            <div className="text-sm font-semibold text-[var(--sg-text-primary)] group-hover:text-[var(--sg-cyan)] transition-colors leading-tight">
              {location.name}
            </div>
            {location.region && (
              <div className="sg-label">{location.region}</div>
            )}
          </div>
        </button>

        <div className="text-right">
          <div className="sg-mono text-sm text-[var(--sg-text-primary)]">{timeStr}</div>
          {lastUpdated && (
            <div className="sg-label">{formatRelativeTime(lastUpdated)}</div>
          )}
        </div>
      </div>

      {/* Main temp row */}
      <div className="flex items-end gap-4 mt-3">
        <div className="flex-1">
          {/* Big temperature */}
          <div className="flex items-start gap-2">
            <span
              className="sg-mono font-bold leading-none sg-glow-cyan"
              style={{ fontSize: 'clamp(4rem, 20vw, 6rem)', color: 'var(--sg-cyan)' }}
            >
              {Math.round(current.temperature)}
            </span>
            <span
              className="sg-mono font-light mt-2"
              style={{ fontSize: '2rem', color: 'var(--sg-cyan-dim)' }}
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
            <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={20} color="#00fff2" />
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
            size={64}
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
              <div
                style={{ width: '1px', height: '24px', background: 'var(--sg-border)' }}
              />
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

      {/* Alert + Status bar */}
      <div className="flex items-center justify-between mt-2 gap-2">
        {/* Alert */}
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

        {/* Stale badge */}
        {isStale && (
          <div className="sg-stale-badge">
            ⚠ STALE
          </div>
        )}
      </div>

      {/* Bottom divider */}
      <div className="sg-divider mt-3" />
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
    </div>
  );
}

function LocationPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
      <path
        d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z"
        stroke="#00fff2"
        strokeWidth={1.2}
        fill="none"
        style={{ filter: 'drop-shadow(0 0 3px #00fff2)' }}
      />
      <circle cx="7" cy="5" r="1.2" fill="#00fff2" />
    </svg>
  );
}
