import type { MarineData, EarthquakeEvent, SpaceWeatherData, FlightsData } from '@/types/extra';

// ──────────────────────────────────────────────────────────
//  Open-Meteo Marine API  (free, no auth, CORS-enabled)
// ──────────────────────────────────────────────────────────
export async function fetchMarineData(lat: number, lon: number): Promise<MarineData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period',
    timezone: 'auto',
  });
  const res = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Marine API ${res.status}`);
  const d = await res.json();
  const c = d.current ?? {};
  const available = c.wave_height != null;
  return {
    waveHeight:     c.wave_height     ?? null,
    waveDirection:  c.wave_direction  ?? null,
    wavePeriod:     c.wave_period     ?? null,
    swellHeight:    c.swell_wave_height    ?? null,
    swellDirection: c.swell_wave_direction ?? null,
    swellPeriod:    c.swell_wave_period    ?? null,
    available,
  };
}

// ──────────────────────────────────────────────────────────
//  USGS Earthquake API  (free, no auth, CORS-enabled)
// ──────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchEarthquakes(lat: number, lon: number): Promise<EarthquakeEvent[]> {
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    maxradiuskm: '1000',
    minmagnitude: '2.5',
    orderby: 'time',
    limit: '10',
  });
  const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`USGS API ${res.status}`);
  const d = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (d.features ?? []).map((f: any) => {
    const [eLon, eLat, depth] = f.geometry.coordinates as [number, number, number];
    return {
      id: f.id as string,
      magnitude: f.properties.mag as number,
      place: f.properties.place as string,
      time: f.properties.time as number,
      depth: Math.round(depth),
      lat: eLat,
      lon: eLon,
      distanceKm: Math.round(haversineKm(lat, lon, eLat, eLon)),
    };
  });
}

// ──────────────────────────────────────────────────────────
//  NOAA SWPC Space Weather  (free, no auth, CORS-enabled)
// ──────────────────────────────────────────────────────────
function kpLabel(kp: number): string {
  if (kp < 2) return 'Quiet';
  if (kp < 3) return 'Unsettled';
  if (kp < 5) return 'Active';
  if (kp < 6) return 'Minor Storm';
  if (kp < 7) return 'Moderate Storm';
  if (kp < 8) return 'Strong Storm';
  if (kp < 9) return 'Severe Storm';
  return 'Extreme Storm';
}

function kpAurora(kp: number): SpaceWeatherData['auroraChance'] {
  if (kp < 3) return 'none';
  if (kp < 4) return 'low';
  if (kp < 5) return 'possible';
  if (kp < 6) return 'likely';
  return 'high';
}

export async function fetchSpaceWeather(): Promise<SpaceWeatherData> {
  const res = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`NOAA SWPC API ${res.status}`);
  const raw: Array<{ time_tag: string; estimated_kp: number }> = await res.json();
  // Sample every 30 entries (≈30 min intervals from 1-min data), last 48 readings
  const sampled = raw.filter((_, i) => i % 30 === 0).slice(-48);
  const latest = raw[raw.length - 1];
  const kp = latest?.estimated_kp ?? 0;
  return {
    kpIndex: Math.round(kp * 10) / 10,
    kpLabel: kpLabel(kp),
    auroraChance: kpAurora(kp),
    history: sampled.map(r => ({ time: r.time_tag, kp: r.estimated_kp })),
  };
}

// ──────────────────────────────────────────────────────────
//  OpenSky Network  (via server-side proxy to avoid CORS)
// ──────────────────────────────────────────────────────────
export async function fetchFlightsOverhead(lat: number, lon: number): Promise<FlightsData> {
  const res = await fetch(`/api/flights?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Flights proxy ${res.status}`);
  return res.json() as Promise<FlightsData>;
}
