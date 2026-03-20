"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WeatherData, LocationInfo } from "@/types/weather";
import { fetchWeatherData } from "@/lib/openmeteo";
import {
  CACHE_KEY,
  REFRESH_INTERVAL_MS,
  STALE_THRESHOLD_MS,
} from "@/lib/constants";

interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
}

export function useWeatherData(location: LocationInfo | null) {
  const [state, setState] = useState<WeatherState>({
    data: null,
    loading: true,
    error: null,
    isStale: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const staleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!location) return;

    setState((prev) => ({ ...prev, loading: !prev.data, error: null }));

    try {
      const data = await fetchWeatherData(location.coordinates, location);
      setState({ data, loading: false, error: null, isStale: false });

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        // Storage full or unavailable
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch weather",
      }));
    }
  }, [location]);

  // Load cached data on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached) as WeatherData;
        const isStale = Date.now() - data.fetchedAt > STALE_THRESHOLD_MS;
        setState({ data, loading: false, error: null, isStale });
      }
    } catch {
      // No cache available
    }
  }, []);

  // Fetch when location changes
  useEffect(() => {
    if (location) {
      refresh();
    }
  }, [location, refresh]);

  // Auto-refresh interval
  useEffect(() => {
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  // Stale check
  useEffect(() => {
    staleCheckRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.data) return prev;
        const isStale = Date.now() - prev.data.fetchedAt > STALE_THRESHOLD_MS;
        if (isStale !== prev.isStale) return { ...prev, isStale };
        return prev;
      });
    }, 60000);

    return () => {
      if (staleCheckRef.current) clearInterval(staleCheckRef.current);
    };
  }, []);

  // Refresh on visibility change (tab/app becomes visible)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && state.data) {
        const age = Date.now() - state.data.fetchedAt;
        if (age > REFRESH_INTERVAL_MS) {
          refresh();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [refresh, state.data]);

  return { ...state, refresh };
}
