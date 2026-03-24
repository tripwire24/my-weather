'use client';

import { useState, useRef, useCallback } from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useHeroPreferences } from '@/hooks/useHeroPreferences';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import { useExtraData } from '@/hooks/useExtraData';
import { HeroSection } from '@/components/HeroSection';
import { HeroCustomizer } from '@/components/HeroCustomizer';
import { LocationSearch } from '@/components/LocationSearch';
import { LiveDashboard } from '@/components/LiveDashboard';
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

type AppTab = 'weather' | 'live';

const PTR_THRESHOLD = 80;

export default function StormGridApp() {
  const { location: geoLocation, loading: geoLoading, requestPermission } = useGeolocation();
  const [manualLocation, setManualLocation] = useState<Location | null>(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('weather');
  const [ptrDistance, setPtrDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeLocation = manualLocation ?? geoLocation;
  const { data, loading, error, isStale, lastUpdated, refresh } = useWeatherData(activeLocation);
  const { enabled: enabledWidgets, toggle: toggleWidget } = useHeroPreferences();
  const { mode: themeMode, setTheme, adaptivePaletteName } = useTheme(data?.current.weatherCode);

  useAutoRefresh(refresh, !!activeLocation);
  const { data: extraData, loading: extraLoading, refresh: refreshExtra } = useExtraData(activeLocation);

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
            border: '1px solid rgba(92, 224, 214,0.3)',
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
        <div
          className="flex items-center justify-between px-4 pb-1"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center gap-2">
            <StormGridLogo />
            <span className="sg-mono text-xs font-bold" style={{ color: 'var(--sg-cyan)', letterSpacing: '0.2em' }}>
              STORMGRID
            </span>
            {themeMode === 'adaptive' && adaptivePaletteName && (
              <span
                className="sg-mono hidden sm:inline"
                style={{ fontSize: '0.55rem', color: 'var(--sg-text-muted)', letterSpacing: '0.1em' }}
              >
                · {adaptivePaletteName.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme toggle group */}
            <ThemeToggle current={themeMode} onChange={setTheme} />

            {/* Refresh button */}
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-all active:opacity-70 active:scale-95"
              style={{ border: '1px solid rgba(92, 224, 214,0.2)', color: 'var(--sg-cyan)' }}
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
            style={{ background: 'rgba(232, 92, 120,0.1)', border: '1px solid rgba(232, 92, 120,0.3)', color: 'var(--sg-red)' }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Hero — always visible at top on weather tab */}
        {(data || showLoading) && (
          <HeroSection
            data={data}
            loading={showLoading}
            isStale={isStale}
            lastUpdated={lastUpdated}
            onLocationTap={() => setShowLocationSearch(true)}
            onCustomize={() => setShowCustomizer(true)}
            enabledWidgets={enabledWidgets}
            extraData={extraData}
          />
        )}

        {/* Weather tab content */}
        {activeTab === 'weather' && (
          <>
            {data && (
              <div className="px-3 pb-24 space-y-2 sg-stagger">
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
            {showLoading && (
              <div className="px-3 pb-24 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="sg-card sg-card-cyan p-4" style={{ height: '56px' }}>
                    <div className="sg-skeleton h-4 w-32 rounded mb-2" />
                    <div className="sg-skeleton h-3 w-48 rounded" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Live feed tab */}
        {activeTab === 'live' && activeLocation && (
          <LiveDashboard
            data={extraData}
            loading={extraLoading}
            onRefresh={refreshExtra}
            location={activeLocation}
          />
        )}
        {activeTab === 'live' && !activeLocation && (
          <div className="px-4 py-8 text-center sg-label">Set a location to see live data.</div>
        )}
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex"
        style={{
          background: 'rgba(8,10,28,0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(92, 224, 214,0.12)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {([
          {
            id: 'weather' as AppTab,
            label: 'WEATHER',
            icon: (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth={1.4} />
                <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M3.22 14.78l1.42-1.42M13.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
              </svg>
            ),
          },
          {
            id: 'live' as AppTab,
            label: 'LIVE',
            icon: (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M1 9c2-4 4-6 6-6s4 2 4 6-2 6-4 6" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
                <path d="M13 5c2 1 3 2.5 3 4s-1 3-3 4" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
                <circle cx="7" cy="9" r="1.5" fill="currentColor" />
                <path d="M1 14h4M15 4l-2 2M15 14l-2-2" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" opacity={0.5} />
              </svg>
            ),
          },
        ] as { id: AppTab; label: string; icon: React.ReactNode }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:opacity-70"
            style={{ color: activeTab === tab.id ? 'var(--sg-cyan)' : 'var(--sg-text-muted)' }}
            aria-label={tab.label}
          >
            <div style={{ filter: activeTab === tab.id ? 'drop-shadow(0 0 4px var(--sg-cyan))' : 'none' }}>
              {tab.icon}
            </div>
            <span
              className="sg-mono"
              style={{
                fontSize: '0.58rem',
                letterSpacing: '0.1em',
                fontWeight: activeTab === tab.id ? 700 : 400,
              }}
            >
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0"
                style={{
                  width: '24px',
                  height: '2px',
                  background: 'var(--sg-cyan)',
                  boxShadow: '0 0 8px var(--sg-cyan)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        ))}
      </nav>

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

// Theme toggle — 3-way: dark / light / adaptive
function ThemeToggle({ current, onChange }: { current: ThemeMode; onChange: (m: ThemeMode) => void }) {
  const modes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dark',
      label: 'DARK',
      icon: (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M8.5 6.5A4 4 0 0 1 3.5 1.5a4 4 0 1 0 5 5z" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'light',
      label: 'LIGHT',
      icon: (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="2" fill="currentColor" />
          <path d="M5 1v1M5 8v1M1 5h1M8 5h1M2.5 2.5l.7.7M6.8 6.8l.7.7M2.5 7.5l.7-.7M6.8 3.2l.7-.7" stroke="currentColor" strokeWidth={0.9} strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'adaptive',
      label: 'AUTO',
      icon: (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth={1} />
          <path d="M5 1.5v7M1.5 5h7" stroke="currentColor" strokeWidth={0.9} strokeLinecap="round" opacity={0.5} />
          <path d="M3 2.5C3 4 5 4.5 5 5s-2 1-2 2.5" stroke="currentColor" strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="flex items-center rounded-md overflow-hidden"
      style={{ border: '1px solid rgba(92, 224, 214,0.15)', gap: 0 }}
    >
      {modes.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`sg-theme-btn${current === id ? ' active' : ''}`}
          style={{ borderRadius: 0, border: 'none', borderRight: id !== 'adaptive' ? '1px solid rgba(92, 224, 214,0.1)' : 'none' }}
          aria-label={`${label} theme`}
          title={`${label} mode`}
        >
          {icon}
          <span className="hidden xs:inline">{label}</span>
        </button>
      ))}
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
      <polygon points="10,2 18,10 10,18 2,10" stroke="#5ce0d6" strokeWidth={1.5} fill="none"
        style={{ filter: 'drop-shadow(0 0 4px #5ce0d6)' }} />
      <polygon points="10,5 15,10 10,15 5,10" stroke="#c874e8" strokeWidth={1} fill="rgba(92, 224, 214,0.05)"
        style={{ filter: 'drop-shadow(0 0 3px #c874e8)' }} />
      <circle cx="10" cy="10" r="2" fill="#5ce0d6" opacity={0.8} />
    </svg>
  );
}
