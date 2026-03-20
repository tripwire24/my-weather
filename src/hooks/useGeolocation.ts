"use client";

import { useState, useEffect, useCallback } from "react";
import type { Coordinates, LocationInfo } from "@/types/weather";
import { reverseGeocode } from "@/lib/openmeteo";
import { LOCATION_KEY } from "@/lib/constants";

interface GeolocationState {
  location: LocationInfo | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: true,
    error: null,
  });

  const setLocation = useCallback((location: LocationInfo) => {
    setState({ location, loading: false, error: null });
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    } catch {
      // localStorage might be unavailable
    }
  }, []);

  const requestGeolocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation not supported",
      }));
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
          });
        }
      );

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const locationInfo = await reverseGeocode(coords);
      setLocation(locationInfo);
    } catch (err) {
      const message =
        err instanceof GeolocationPositionError
          ? err.code === 1
            ? "Location permission denied"
            : "Unable to determine location"
          : "Location lookup failed";

      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [setLocation]);

  // Load saved location or request geolocation on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCATION_KEY);
      if (saved) {
        const location = JSON.parse(saved) as LocationInfo;
        setState({ location, loading: false, error: null });
        return;
      }
    } catch {
      // Fall through to geolocation
    }

    requestGeolocation();
  }, [requestGeolocation]);

  return {
    ...state,
    setLocation,
    requestGeolocation,
  };
}
