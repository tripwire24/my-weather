'use client';

import { useState, useEffect } from 'react';
import type { Location } from '@/types/weather';
import { STORAGE_KEYS } from '@/lib/constants';

interface GeolocationState {
  location: Location | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => void;
}

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stored location on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOCATION);
      if (stored) {
        setLocation(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const requestPermission = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Set location immediately with coordinates so weather can start loading
        const coordName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        const loc: Location = {
          name: coordName,
          latitude,
          longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        setLocation(loc);
        localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(loc));
        setLoading(false);

        // Resolve a proper place name in the background (non-blocking)
        reverseGeocode(latitude, longitude)
          .then((name) => {
            const namedLoc: Location = { ...loc, name };
            setLocation(namedLoc);
            localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(namedLoc));
          })
          .catch(() => {
            // Keep coordinate-based name, no problem
          });
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please search for a location manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location unavailable. Please try again.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('Unable to get location.');
        }
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
    );
  };

  // Auto-request on mount if no stored location
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.LOCATION);
    if (!stored) {
      requestPermission();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, loading, error, requestPermission };
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'StormGrid/1.0' }, signal: controller.signal }
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = data.address ?? {};

    const localName =
      addr.neighbourhood ??
      addr.suburb ??
      addr.quarter ??
      addr.village ??
      addr.hamlet ??
      addr.town ??
      addr.city_district ??
      addr.city ??
      addr.municipality ??
      addr.county ??
      addr.state_district ??
      addr.state ??
      null;

    if (!localName) throw new Error('No place name in response');
    return localName;
  } finally {
    clearTimeout(timeoutId);
  }
}
