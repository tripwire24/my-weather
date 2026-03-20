'use client';

import { useState, useRef, useCallback } from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useHeroPreferences } from '@/hooks/useHeroPreferences';
import { HeroSection } from '@/components/HeroSection';
import { HeroCustomizer } from '@/components/HeroCustomizer';
import { LocationSearch } from '@/components/LocationSearch';
import { HourlyForecast } from '@/components/HourlyForecast';
import { WeeklyForecast } from '@/components/WeeklyForecast';
import { WindAtmosphere } from '@/components/WindAtmosphere';
import { PrecipitationStorms } from '@/components/PrecipitationStorms';
import { SunMoon } from '@/components/SunMoon';
import { UVSolar } from '@/components/UVSolar';
import { AstronomySeasons } from '@/components/AstronomySeasons';
import { AirQuality } from '@/components/AirQuality';
import { FeelsLike } from '@/components/FeelsLike';
import type { Location } from '@/types/weather';

const PTR_THRESHOLD = 80;

export default function StormGridApp() {
  const { location: geoLocation, loading: geoLoading, requestPermission } = useGeolocation();
  const [manualLocation, setManualLocation] = useState<Location | null>(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [ptrDistance, setPtrDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeLocation = manualLocation ?? geoLocation;
  const { data, loading, error, isStale, lastUpdated, refresh } = useWeatherData(activeLocation);
  const { enabled: enabledWidgets, toggle: toggleWidget } = useHeroPreferences();

  useAutoRefresh(refresh, !!activeLocation);

  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) setPtrDistance(Math.min(PTR_THRESHOLD * 1.5, diff * 0.5));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (ptrDistance >= PTR_THRESHOLD) {
      setIsRefreshing(true);
      refresh();
      setTimeout(() => setIsRefreshing(false), 1500);
    }
    setPtrDistance(0);
  }, [ptrDistance, refresh]);

  const pressureTrend = getPressureTrend(data?.hourly ?? []);
  const showLoading = loading && !data;
  const showError = error && !data;

  return (
    <div className="relative min-h-dvh" style={{ background: 'var(--sg-bg)' }}>
      <div className="sg-grid-bg" />
      <div className="sg-scanlines" />
      <div className="sg-vignette" />

      {/* Pull-to-refresh indicator */}
      {(ptrDistance > 10 || isRefreshing) && (
        <div
          className="fixed top-0 left-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-b-2xl text-xs sg-mono"
          style={{
            background: 'rgba(8,12,30,0.9)',
            border: '1px solid rgba(0,255,242,0.3)',
            borderTop: 'none',
            color: 'var(--sg-cyan)',
            transform: `translateX(-50%) translateY(${isRefreshing ? 0 : Math.min(1, ptrDistance / PTR_THRESHOLD) * 20}px)`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {isRefreshing ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'sg-rotate 1s linear infinite' }}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth={1.5} strokeDasharray="14 6" strokeLinecap="round" />
              </svg>
              Refreshing...
            </>
          ) : (
            <>↓ {ptrDistance >= PTR_THRESHOLD ? 'Release' : 'Pull'} to refresh</>
          )}
        </div>
      )}

      {/* Main scrollable container */}
      <div
        ref={containerRef}
        className="relative z-10 h-dvh overflow-y-auto"
        style={{ overscrollBehaviorY: 'contain' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* App header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <StormGridLogo />
            <span className="sg-mono text-xs font-bold" style={{ color: 'var(--sg-cyan)', letterSpacing: '0.2em' }}>
              STORMGRID
            </span>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all active:opacity-70"
            style={{ border: '1px solid rgba(0,255,242,0.2)', color: 'var(--sg-cyan)' }}
            aria-label="Refresh"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
              style={{ animation: loading ? 'sg-rotate 1s linear infinite' : 'none' }}
            >
              <path d="M11 2.5A5.5 5.5 0 0 0 1 6.5M2 10.5A5.5 5.5 0 0 0 12 6.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
              <path d="M11 2.5V5.5H8M2 10.5V7.5H5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* States */}
        {!activeLocation && !geoLoading && (
          <LocationPrompt onRequest={() => setShowLocationSearch(true)} />
        )}
        {geoLoading && !activeLocation && (
          <div className="px-4 py-3 text-center sg-label">Requesting location...</div>
        )}
        {showError && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-lg text-xs sg-mono"
            style={{ background: 'rgba(255,51,85,0.1)', border: '1px solid rgba(255,51,85,0.3)', color: 'var(--sg-red)' }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Hero */}
        {(data || showLoading) && (
          <HeroSection
            data={data}
            loading={showLoading}
            isStale={isStale}
            lastUpdated={lastUpdated}
            onLocationTap={() => setShowLocationSearch(true)}
            onCustomize={() => setShowCustomizer(true)}
            enabledWidgets={enabledWidgets}
          />
        )}

        {/* Detail sections */}
        {data && (
          <div className="px-3 pb-8 space-y-2 sg-stagger">
            <HourlyForecast hourly={data.hourly} />
            <WeeklyForecast daily={data.daily} />
            <WindAtmosphere current={data.current} pressureTrend={pressureTrend} />
            <PrecipitationStorms current={data.current} hourly={data.hourly} dailyPrecipTotal={data.daily[0]?.precipitation ?? 0} />
            <SunMoon sun={data.sun} moon={data.moon} />
            <UVSolar current={data.current} hourly={data.hourly} solarNoon={data.sun.solarNoon} />
            <AstronomySeasons astronomy={data.astronomy} dayLength={data.sun.dayLength} />
            {data.airQuality && <AirQuality airQuality={data.airQuality} />}
            <FeelsLike current={data.current} />
          </div>
        )}

        {/* Loading skeletons */}
        {showLoading && (
          <div className="px-3 pb-8 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="sg-card sg-card-cyan p-4" style={{ height: '56px' }}>
                <div className="sg-skeleton h-4 w-32 rounded mb-2" />
                <div className="sg-skeleton h-3 w-48 rounded" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showLocationSearch && (
        <LocationSearch
          onSelect={setManualLocation}
          onClose={() => setShowLocationSearch(false)}
          onRequestGps={requestPermission}
        />
      )}
      {showCustomizer && (
        <HeroCustomizer
          enabled={enabledWidgets}
          onToggle={toggleWidget}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
}

function getPressureTrend(hourly: { pressure?: number; time: string }[]): 'rising' | 'falling' | 'steady' {
  if (hourly.length < 4) return 'steady';
  const now = new Date();
  const recent = hourly.filter(h => {
    const t = new Date(h.time).getTime();
    return t >= now.getTime() - 3600000 * 3 && t <= now.getTime();
  });
  if (recent.length < 2) return 'steady';
  type H = { pressure?: number; time: string };
  const pressures = (recent as H[]).map(h => h.pressure ?? 0).filter(p => p > 0);
  if (pressures.length < 2) return 'steady';
  const diff = pressures[pressures.length - 1] - pressures[0];
  if (diff > 1) return 'rising';
  if (diff < -1) return 'falling';
  return 'steady';
}

function LocationPrompt({ onRequest }: { onRequest: () => void }) {
  return (
    <div className="mx-4 my-6 p-6 text-center sg-card sg-card-cyan">
      <div className="text-4xl mb-3">📍</div>
      <div className="text-sm font-semibold text-[var(--sg-text-primary)] mb-1">Location Required</div>
      <div className="sg-label mb-4">StormGrid needs your location to show weather data.</div>
      <button onClick={onRequest} className="sg-btn mx-auto block">SET LOCATION</button>
    </div>
  );
}

function StormGridLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <polygon points="10,2 18,10 10,18 2,10" stroke="#00fff2" strokeWidth={1.5} fill="none"
        style={{ filter: 'drop-shadow(0 0 4px #00fff2)' }} />
      <polygon points="10,5 15,10 10,15 5,10" stroke="#ff00ff" strokeWidth={1} fill="rgba(0,255,242,0.05)"
        style={{ filter: 'drop-shadow(0 0 3px #ff00ff)' }} />
      <circle cx="10" cy="10" r="2" fill="#00fff2" opacity={0.8} />
    </svg>
  );
}
