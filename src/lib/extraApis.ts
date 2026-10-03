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

// ──────────────────────────────────────────────────────────
//  v2 additions
// ──────────────────────────────────────────────────────────
import type { SkyHour, TidePoint } from '@/lib/insights';
import { tideExtrema } from '@/lib/insights';

const jget = async (url: string, ms = 9000) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${new URL(url).hostname} ${res.status}`);
  return res.json();
};

export interface RadarFrame { time: number; path: string }
export async function fetchRadarFrames(): Promise<{ host: string; frames: RadarFrame[] }> {
  const d = await jget('https://api.rainviewer.com/public/weather-maps.json');
  const frames: RadarFrame[] = [...(d.radar?.past ?? []), ...(d.radar?.nowcast ?? [])];
  if (!frames.length) throw new Error('No radar frames');
  return { host: d.host as string, frames };
}

export async function fetchSky(lat: number, lon: number): Promise<SkyHour[]> {
  const p = new URLSearchParams({ latitude: lat.toFixed(3), longitude: lon.toFixed(3), hourly: 'cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility', forecast_days: '3', timezone: 'auto' });
  const d = await jget(`https://api.open-meteo.com/v1/forecast?${p}`);
  const h = d.hourly;
  return (h.time as string[]).map((time, i) => ({ time, cloud: h.cloud_cover[i] ?? 0, low: h.cloud_cover_low[i] ?? 0, mid: h.cloud_cover_mid[i] ?? 0, high: h.cloud_cover_high[i] ?? 0, visibility: (h.visibility[i] ?? 20000) / 1000 }));
}

export interface TideData { available: boolean; extrema: TidePoint[]; times: string[]; levels: number[] }
export async function fetchTides(lat: number, lon: number): Promise<TideData> {
  const p = new URLSearchParams({ latitude: lat.toFixed(3), longitude: lon.toFixed(3), hourly: 'sea_level_height_msl', forecast_days: '3', timezone: 'auto' });
  const d = await jget(`https://marine-api.open-meteo.com/v1/marine?${p}`);
  const times: string[] = d.hourly?.time ?? [];
  const levels: (number | null)[] = d.hourly?.sea_level_height_msl ?? [];
  if (!levels.length || levels.every(v => v == null)) return { available: false, extrema: [], times: [], levels: [] };
  return { available: true, extrema: tideExtrema(times, levels), times, levels: levels.map(v => v ?? 0) };
}

export interface GeoNetQuake { id: string; magnitude: number; mmi: number; locality: string; time: number; depth: number; lat: number; lon: number; distanceKm: number }
export async function fetchGeoNetQuakes(lat: number, lon: number): Promise<GeoNetQuake[]> {
  const d = await jget('https://api.geonet.org.nz/quake?MMI=3');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (d.features ?? []).filter((f: any) => f.properties.quality !== 'deleted').map((f: any) => {
    const [qLon, qLat] = f.geometry.coordinates as [number, number];
    return { id: f.properties.publicID, magnitude: f.properties.magnitude, mmi: f.properties.mmi, locality: f.properties.locality, time: new Date(f.properties.time).getTime(), depth: Math.round(f.properties.depth), lat: qLat, lon: qLon, distanceKm: Math.round(haversineKm(lat, lon, qLat, qLon)) };
  }).sort((a: GeoNetQuake, b: GeoNetQuake) => b.time - a.time).slice(0, 12);
}

export interface KpForecast { max24h: number; maxTime: string | null; series: { time: string; kp: number; observed: boolean }[] }
export async function fetchKpForecast(): Promise<KpForecast> {
  const raw: Array<{ time_tag: string; kp: string | number; observed: string }> = await jget('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json');
  const now = Date.now();
  const series = raw.map(r => ({ time: r.time_tag + 'Z', kp: Number(r.kp), observed: r.observed === 'observed' })).filter(r => new Date(r.time).getTime() > now - 6 * 3600e3);
  const next = series.filter(r => new Date(r.time).getTime() < now + 24 * 3600e3);
  const top = next.reduce<{ time: string; kp: number } | null>((a, b) => (!a || b.kp > a.kp ? b : a), null);
  return { max24h: top?.kp ?? 0, maxTime: top?.time ?? null, series: series.slice(0, 16) };
}

export interface HistoryStats {
  rain30: number; rain30Avg: number; rain30Rank: number; years: number;
  rainYtd: number; rainYtdAvg: number;
  temp30: number; temp30Avg: number;
  wettestDay: { date: string; mm: number } | null;
  label30: string;
}
export async function fetchHistory(lat: number, lon: number): Promise<HistoryStats> {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const end = new Date(today.getTime() - 3 * 86400e3);
  const startYear = end.getUTCFullYear() - 5;
  const p = new URLSearchParams({ latitude: lat.toFixed(3), longitude: lon.toFixed(3), start_date: `${startYear}-01-01`, end_date: iso(end), daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min', timezone: 'auto' });
  const d = await jget(`https://archive-api.open-meteo.com/v1/archive?${p}`, 15000);
  const t: string[] = d.daily.time, pr: (number | null)[] = d.daily.precipitation_sum, tx: (number | null)[] = d.daily.temperature_2m_max, tn: (number | null)[] = d.daily.temperature_2m_min;
  const endY = end.getUTCFullYear();
  const windowFor = (y: number) => {
    const e = new Date(Date.UTC(y, end.getUTCMonth(), end.getUTCDate()));
    const s = new Date(e.getTime() - 29 * 86400e3);
    return [iso(s), iso(e)] as const;
  };
  const sums: { y: number; rain: number; temp: number }[] = [];
  for (let y = startYear; y <= endY; y++) {
    const [s, e] = windowFor(y);
    let rain = 0, tsum = 0, n = 0;
    t.forEach((day, i) => { if (day >= s && day <= e) { rain += pr[i] ?? 0; if (tx[i] != null && tn[i] != null) { tsum += ((tx[i] as number) + (tn[i] as number)) / 2; n++; } } });
    sums.push({ y, rain, temp: n ? tsum / n : 0 });
  }
  const cur = sums[sums.length - 1], prev = sums.slice(0, -1);
  const ytd = (y: number) => { let r = 0; const cut = `${y}-${iso(end).slice(5)}`; t.forEach((day, i) => { if (day.startsWith(`${y}-`) && day <= cut) r += pr[i] ?? 0; }); return r; };
  const ytdPrev = prev.map(s => ytd(s.y));
  let wet: { date: string; mm: number } | null = null;
  t.forEach((day, i) => { if (day.startsWith(`${endY}-`) && (pr[i] ?? 0) > (wet?.mm ?? 0)) wet = { date: day, mm: pr[i] as number }; });
  const month = (dt: Date) => dt.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const [ws] = windowFor(endY);
  return {
    rain30: cur.rain, rain30Avg: prev.reduce((s, x) => s + x.rain, 0) / prev.length,
    rain30Rank: 1 + prev.filter(x => x.rain > cur.rain).length, years: prev.length + 1,
    rainYtd: ytd(endY), rainYtdAvg: ytdPrev.reduce((s, x) => s + x, 0) / ytdPrev.length,
    temp30: cur.temp, temp30Avg: prev.reduce((s, x) => s + x.temp, 0) / prev.length,
    wettestDay: wet, label30: `${month(new Date(ws))} to ${month(end)}`,
  };
}

export interface RainSoon { startsAt: string | null; inMinutes: number | null; raining: boolean; peak: number }
export async function fetchRainSoon(lat: number, lon: number): Promise<RainSoon> {
  const p = new URLSearchParams({ latitude: lat.toFixed(3), longitude: lon.toFixed(3), minutely_15: 'precipitation', forecast_minutely_15: '16', past_minutely_15: '1', timezone: 'auto' });
  const d = await jget(`https://api.open-meteo.com/v1/forecast?${p}&current=precipitation`);
  const times: string[] = d.minutely_15.time, vals: number[] = d.minutely_15.precipitation;
  const curTime: string = d.current.time;
  const raining = (d.current.precipitation ?? 0) >= 0.1;
  const idx = times.findIndex(x => x > curTime);
  const ahead = idx < 0 ? [] : times.slice(idx).map((x, i) => ({ x, v: vals[idx + i] ?? 0 }));
  const first = ahead.find(a => a.v >= 0.15);
  let inMinutes: number | null = null;
  if (first) { const a = new Date(first.x + 'Z').getTime(), b = new Date(curTime + 'Z').getTime(); inMinutes = Math.max(0, Math.round((a - b) / 60000)); }
  return { startsAt: first?.x ?? null, inMinutes, raining, peak: Math.max(0, ...ahead.map(a => a.v)) };
}
