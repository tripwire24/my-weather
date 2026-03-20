"use client";

import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeatherData } from "@/hooks/useWeatherData";
import { usePullToRefresh } from "@/hooks/useAutoRefresh";
import { HeroSection } from "@/components/HeroSection";
import { HourlyForecast } from "@/components/HourlyForecast";
import { WeeklyForecast } from "@/components/WeeklyForecast";
import { WindAtmosphere } from "@/components/WindAtmosphere";
import { PrecipitationStorms } from "@/components/PrecipitationStorms";
import { SunMoon } from "@/components/SunMoon";
import { UVSolar } from "@/components/UVSolar";
import { AstronomySeasons } from "@/components/AstronomySeasons";
import { AirQuality } from "@/components/AirQuality";
import { FeelsLike } from "@/components/FeelsLike";
import { LocationSearch } from "@/components/LocationSearch";
import type { LocationInfo } from "@/types/weather";

export default function Home() {
  const {
    location,
    loading: geoLoading,
    error: geoError,
    setLocation,
    requestGeolocation,
  } = useGeolocation();

  const {
    data,
    loading: weatherLoading,
    error: weatherError,
    isStale,
    refresh,
  } = useWeatherData(location);

  const { pullDistance, refreshing, threshold } = usePullToRefresh(
    async () => {
      await refresh();
    }
  );

  // Loading state
  if (geoLoading || (weatherLoading && !data)) {
    return <LoadingScreen />;
  }

  // Error state with no data
  if (!data && (geoError || weatherError)) {
    return (
      <ErrorScreen
        error={geoError || weatherError || "Something went wrong"}
        onRetry={() => {
          if (geoError) requestGeolocation();
          else refresh();
        }}
        onSearchLocation={setLocation}
        onRequestGeolocation={requestGeolocation}
      />
    );
  }

  if (!data) return <LoadingScreen />;

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center py-2 transition-all"
          style={{
            height: refreshing ? 40 : Math.min(pullDistance, threshold * 1.2),
            opacity: refreshing ? 1 : pullDistance / threshold,
          }}
        >
          <div
            className={`w-5 h-5 border-2 border-sg-cyan/40 border-t-sg-cyan rounded-full ${
              refreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${(pullDistance / threshold) * 360}deg)`,
            }}
          />
        </div>
      )}

      {/* Hero */}
      <HeroSection data={data} isStale={isStale} />

      {/* Location search */}
      <div className="px-4 mb-4">
        <LocationSearch
          onSelect={setLocation}
          onRequestGeolocation={requestGeolocation}
        />
      </div>

      {/* Detail sections */}
      <div className="px-4 space-y-3">
        <HourlyForecast data={data} />
        <WeeklyForecast data={data} />
        <WindAtmosphere data={data} />
        <PrecipitationStorms data={data} />
        <SunMoon data={data} />
        <UVSolar data={data} />
        <AstronomySeasons data={data} />
        <AirQuality data={data} />
        <FeelsLike data={data} />
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-sg-text-muted pb-4">
        <p className="sg-data">STORMGRID</p>
        <p className="mt-1">Powered by Open-Meteo</p>
      </footer>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
      <div className="relative">
        {/* Animated hexagon */}
        <svg width="80" height="80" viewBox="0 0 80 80">
          <path
            d="M20,5 L60,5 L75,40 L60,75 L20,75 L5,40 Z"
            fill="none"
            stroke="#00fff2"
            strokeWidth="1.5"
            opacity="0.3"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="240"
              to="0"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-dasharray"
              values="0 240;120 120;240 0"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
          {/* Lightning bolt */}
          <path
            d="M36,18 L48,18 L42,36 L52,36 L32,62 L38,40 L28,40 Z"
            fill="#00fff2"
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values="0.8;0.3;0.8"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>
      <p className="sg-data text-sm text-sg-cyan sg-pulse">
        INITIALIZING
      </p>
      <p className="text-xs text-sg-text-muted">
        Loading weather data...
      </p>
    </div>
  );
}

function ErrorScreen({
  error,
  onRetry,
  onSearchLocation,
  onRequestGeolocation,
}: {
  error: string;
  onRetry: () => void;
  onSearchLocation: (location: LocationInfo) => void;
  onRequestGeolocation: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <path
          d="M20,5 L28,5 L32,20 L16,20 Z"
          fill="none"
          stroke="#ff3366"
          strokeWidth="1.5"
        />
        <text
          x="24"
          y="16"
          textAnchor="middle"
          fill="#ff3366"
          fontSize="12"
          fontFamily="monospace"
        >
          !
        </text>
      </svg>
      <p className="text-sm text-sg-red text-center">{error}</p>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs sg-card sg-glow-cyan text-sg-cyan hover:bg-white/5 transition-colors rounded-lg"
        >
          Retry
        </button>
      </div>
      <div className="w-full max-w-xs mt-4">
        <LocationSearch
          onSelect={onSearchLocation}
          onRequestGeolocation={onRequestGeolocation}
        />
      </div>
    </div>
  );
}
