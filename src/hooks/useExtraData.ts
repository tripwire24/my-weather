'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Location } from '@/types/weather';
import type { ExtraData, ExtraState } from '@/types/extra';
import {
  fetchMarineData,
  fetchEarthquakes,
  fetchSpaceWeather,
  fetchFlightsOverhead,
} from '@/lib/extraApis';

const CACHE_KEY = 'sg_extra_data';
const STALE_MS = 10 * 60 * 1000; // 10 minutes

export function useExtraData(location: Location | null): ExtraState & { refresh: () => void } {
  const [state, setState] = useState<ExtraState>({ data: null, loading: false, errors: {} });
  const locationKey = location
    ? `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`
    : null;
  const prevKey = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!location) return;
    setState(prev => ({ ...prev, loading: true, errors: {} }));

    const [marineResult, quakeResult, spaceResult, flightResult] = await Promise.allSettled([
      fetchMarineData(location.latitude, location.longitude),
      fetchEarthquakes(location.latitude, location.longitude),
      fetchSpaceWeather(),
      fetchFlightsOverhead(location.latitude, location.longitude),
    ]);

    const errors: ExtraState['errors'] = {};
    if (marineResult.status === 'rejected') errors.marine       = String(marineResult.reason);
    if (quakeResult.status  === 'rejected') errors.earthquakes  = String(quakeResult.reason);
    if (spaceResult.status  === 'rejected') errors.spaceWeather = String(spaceResult.reason);
    if (flightResult.status === 'rejected') errors.flights      = String(flightResult.reason);

    const data: ExtraData = {
      marine:       marineResult.status === 'fulfilled' ? marineResult.value : null,
      earthquakes:  quakeResult.status  === 'fulfilled' ? quakeResult.value  : [],
      spaceWeather: spaceResult.status  === 'fulfilled' ? spaceResult.value  : null,
      flights:      flightResult.status === 'fulfilled' ? flightResult.value : null,
      fetchedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ locationKey, data }));
    } catch {}

    setState({ data, loading: false, errors });
  }, [location, locationKey]);

  useEffect(() => {
    if (!locationKey) return;
    if (locationKey === prevKey.current) return;
    prevKey.current = locationKey;

    // Try cache first for instant display
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: { locationKey: string; data: ExtraData } = JSON.parse(cached);
        if (parsed.locationKey === locationKey) {
          const age = Date.now() - new Date(parsed.data.fetchedAt).getTime();
          setState({ data: parsed.data, loading: age > STALE_MS, errors: {} });
          if (age <= STALE_MS) return;
        }
      }
    } catch {}

    load();
  }, [locationKey, load]);

  return { ...state, refresh: load };
}
