'use client';

import { useState, useEffect, useCallback } from 'react';

export type HeroWidgetId =
  | 'wind'
  | 'humidity'
  | 'uv'
  | 'pressure'
  | 'dewpoint'
  | 'visibility'
  | 'precip_prob'
  | 'cloud_cover'
  | 'sunrise_sunset';

export interface HeroWidget {
  id: HeroWidgetId;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export const HERO_WIDGETS: HeroWidget[] = [
  { id: 'wind',         label: 'Wind',              description: 'Speed & direction',       defaultEnabled: true },
  { id: 'humidity',     label: 'Humidity',           description: 'Relative humidity %',     defaultEnabled: true },
  { id: 'uv',           label: 'UV Index',           description: 'Current UV level',        defaultEnabled: true },
  { id: 'pressure',     label: 'Pressure',           description: 'Barometric pressure',     defaultEnabled: false },
  { id: 'dewpoint',     label: 'Dew Point',          description: 'Dew point temperature',   defaultEnabled: false },
  { id: 'visibility',   label: 'Visibility',         description: 'How far you can see',     defaultEnabled: false },
  { id: 'precip_prob',  label: 'Rain Chance',        description: 'Precipitation probability', defaultEnabled: true },
  { id: 'cloud_cover',  label: 'Cloud Cover',        description: 'Cloud coverage %',        defaultEnabled: false },
  { id: 'sunrise_sunset', label: 'Sunrise / Sunset', description: 'Today\'s sun times',     defaultEnabled: true },
];

const STORAGE_KEY = 'sg_hero_widgets';

function getDefaults(): Set<HeroWidgetId> {
  return new Set(HERO_WIDGETS.filter(w => w.defaultEnabled).map(w => w.id));
}

export function useHeroPreferences() {
  const [enabled, setEnabled] = useState<Set<HeroWidgetId>>(getDefaults);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: HeroWidgetId[] = JSON.parse(stored);
        setEnabled(new Set(parsed));
      }
    } catch {}
  }, []);

  const toggle = useCallback((id: HeroWidgetId) => {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const isEnabled = useCallback((id: HeroWidgetId) => enabled.has(id), [enabled]);

  return { enabled, toggle, isEnabled };
}
