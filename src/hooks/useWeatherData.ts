'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WeatherData, WeatherState, Location } from '@/types/weather';
import { fetchWeather } from '@/lib/openmeteo';
import { STORAGE_KEYS, STALE_THRESHOLD_MS } from '@/lib/constants';

export function useWeatherData(location: Location | null): WeatherState & {
  refresh: () => void;
} {
  const [state, setState] = useState<WeatherState>({
    data: null,
    loading: false,
    error: null,
    isStale: false,
    lastUpdated: null,
  });

  const checkStale = useCallback((fetchedAt: string) => {
    return Date.now() - new Date(fetchedAt).getTime() > STALE_THRESHOLD_MS;
  }, []);

  const loadFromCache = useCallback((): WeatherData | null => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.WEATHER_CACHE);
      if (!cached) return null;
      const data: WeatherData = JSON.parse(cached);
      // Only use cache if location matches
      if (
        location &&
        Math.abs(data.location.latitude - location.latitude) < 0.1 &&
        Math.abs(data.location.longitude - location.longitude) < 0.1
      ) {
        return data;
      }
    } catch {}
    return null;
  }, [location]);

  const saveToCache = useCallback((data: WeatherData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.WEATHER_CACHE, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.LAST_FETCHED, data.fetchedAt);
    } catch {}
  }, []);

  const fetch = useCallback(async () => {
    if (!location) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchWeather(location);
      saveToCache(data);
      setState({
        data,
        loading: false,
        error: null,
        isStale: false,
        lastUpdated: data.fetchedAt,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch weather';

      // Try to load from cache as fallback
      const cached = loadFromCache();
      if (cached) {
        setState({
          data: cached,
          loading: false,
          error: errorMsg,
          isStale: true,
          lastUpdated: cached.fetchedAt,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
      }
    }
  }, [location, saveToCache, loadFromCache]);

  // Load on location change
  useEffect(() => {
    if (!location) return;

    // Try cache first for instant display
    const cached = loadFromCache();
    if (cached) {
      const isStale = checkStale(cached.fetchedAt);
      setState({
        data: cached,
        loading: !isStale ? false : true,
        error: null,
        isStale,
        lastUpdated: cached.fetchedAt,
      });
      if (isStale) {
        // Refresh in background
        fetch();
      }
    } else {
      fetch();
    }
  }, [location?.latitude, location?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refresh: fetch };
}
