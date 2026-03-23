'use client';

import { MarineCard } from '@/components/extra/MarineCard';
import { EarthquakeCard } from '@/components/extra/EarthquakeCard';
import { SpaceWeatherCard } from '@/components/extra/SpaceWeatherCard';
import { FlightsCard } from '@/components/extra/FlightsCard';
import type { ExtraData } from '@/types/extra';
import type { Location } from '@/types/weather';

interface LiveDashboardProps {
  data: ExtraData | null;
  loading: boolean;
  onRefresh: () => void;
  location?: Location | null;
}

export function LiveDashboard({ data, loading, onRefresh, location }: LiveDashboardProps) {
  const updatedAt = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true })
    : null;

  return (
    <div className="px-3 pb-8 pt-2 sg-animate-fade-in">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <div
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'var(--sg-cyan)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            LIVE FEED
          </div>
          {updatedAt && (
            <div className="sg-label mt-0.5">Updated {updatedAt}</div>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sg-mono transition-all active:opacity-70"
          style={{
            border: '1px solid rgba(92, 224, 214,0.2)',
            color: 'var(--sg-cyan)',
            background: loading ? 'rgba(92, 224, 214,0.05)' : 'transparent',
          }}
        >
          <svg
            width="11" height="11" viewBox="0 0 11 11" fill="none"
            style={{ animation: loading ? 'sg-rotate 1s linear infinite' : 'none' }}
          >
            <path d="M9.5 2A4.5 4.5 0 0 0 1 5.5M1.5 9A4.5 4.5 0 0 0 10 5.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
            <path d="M9.5 2V4.5H7M1.5 9V6.5H4" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {loading ? 'LOADING' : 'REFRESH'}
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-2 sg-stagger">
        <MarineCard
          data={data?.marine ?? null}
          loading={loading && !data}
        />
        <EarthquakeCard
          quakes={data?.earthquakes ?? []}
          loading={loading && !data}
          userLat={location?.latitude}
          userLon={location?.longitude}
        />
        <SpaceWeatherCard
          data={data?.spaceWeather ?? null}
          loading={loading && !data}
        />
        <FlightsCard
          data={data?.flights ?? null}
          loading={loading && !data}
          userLat={location?.latitude}
          userLon={location?.longitude}
        />
      </div>

      {/* Attribution */}
      <div className="mt-6 px-1 space-y-1">
        <div className="sg-label" style={{ fontSize: '0.55rem', lineHeight: '1.6' }}>
          DATA SOURCES: Open-Meteo Marine API · USGS Earthquake Hazards Program · NOAA Space Weather Prediction Center · OpenSky Network
        </div>
        <div className="sg-label" style={{ fontSize: '0.55rem' }}>
          All data is provided free of charge by public scientific agencies. Accuracy may vary.
        </div>
      </div>
    </div>
  );
}
