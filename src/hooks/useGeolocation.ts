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
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode using Open-Meteo geocoding isn't available,
          // so we use a nominatim call or fallback to coordinates
          const name = await reverseGeocode(latitude, longitude);
          const loc: Location = {
            name,
            latitude,
            longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
          setLocation(loc);
          localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(loc));
        } catch {
          // Fallback: just use coordinates
          const loc: Location = {
            name: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
          setLocation(loc);
          localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(loc));
        } finally {
          setLoading(false);
        }
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
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  const addr = data.address;
  return addr.city ?? addr.town ?? addr.suburb ?? addr.village ?? addr.county ?? 'Unknown Location';
}
