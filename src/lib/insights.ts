import type { HourlyForecast as Hour } from '@/types/weather';

export const dateOf = (t: string) => t.slice(0, 10);
export const minsOf = (t: string) => Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16));
export function clock(m: number) {
  const v = ((Math.round(m) % 1440) + 1440) % 1440;
  const h = Math.floor(v / 60), mm = v % 60;
  return `${h % 12 || 12}${mm ? ':' + String(mm).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`;
}
export const hourName = (t: string) => clock(minsOf(t));
export const clamp = (n: number, a = 0, b = 100) => Math.min(b, Math.max(a, n));

export type OutsideMode = 'dog' | 'kids';
export interface OutsideScore { score: number; label: string; tone: 'great' | 'good' | 'meh' | 'bad'; reasons: string[] }

export function scoreHour(h: Hour, mode: OutsideMode): OutsideScore {
  const parts: [number, string][] = [];
  const rain = h.precipitationProbability * 0.55 + Math.min(h.precipitation, 3) * 14;
  if (rain > 8) parts.push([rain, h.precipitation >= 0.2 ? `rain likely (${h.precipitationProbability}%)` : `${h.precipitationProbability}% rain chance`]);
  const wind = Math.max(0, h.windGusts - 28) * 1.1 + Math.max(0, h.windSpeed - 18) * 0.7;
  if (wind > 6) parts.push([wind, `gusts to ${Math.round(h.windGusts)} km/h`]);
  const [lo, hi] = mode === 'dog' ? [7, 21] : [12, 25];
  const ft = h.feelsLike;
  if (ft < lo) parts.push([(lo - ft) * 3.2, `feels cold (${Math.round(ft)}°)`]);
  if (ft > hi) parts.push([(ft - hi) * (mode === 'dog' ? 5 : 4), `feels hot (${Math.round(ft)}°)`]);
  if (h.uvIndex >= 6) parts.push([(h.uvIndex - 5) * (mode === 'kids' ? 6 : 3), `UV ${h.uvIndex.toFixed(0)}, slap on sunscreen`]);
  if (!h.isDay) parts.push([mode === 'kids' ? 35 : 10, 'after dark']);
  const total = parts.reduce((s, p) => s + p[0], 0);
  const score = Math.round(clamp(100 - total));
  const label = score >= 80 ? 'Great' : score >= 60 ? 'Good' : score >= 40 ? 'Meh' : 'Stay in';
  const tone = score >= 80 ? 'great' : score >= 60 ? 'good' : score >= 40 ? 'meh' : 'bad';
  return { score, label, tone, reasons: parts.sort((a, b) => b[0] - a[0]).slice(0, 2).map(p => p[1]) };
}

export function bestWindow(hours: Hour[], mode: OutsideMode, span = 2) {
  let best = -1, bestAvg = -1;
  for (let i = 0; i + span <= hours.length; i++) {
    const avg = hours.slice(i, i + span).reduce((s, h) => s + scoreHour(h, mode).score, 0) / span;
    if (avg > bestAvg) { bestAvg = avg; best = i; }
  }
  return best < 0 ? null : { start: best, span, avg: Math.round(bestAvg) };
}

export function packList(h: Hour): string[] {
  const out: string[] = [];
  if (h.precipitationProbability >= 40 || h.precipitation >= 0.2) out.push('Raincoat / umbrella');
  if (h.feelsLike < 10) out.push('Warm jacket + beanie');
  else if (h.feelsLike < 16) out.push('Jacket');
  else if (h.feelsLike < 20) out.push('Light layer');
  if (h.windGusts >= 40) out.push('Windproof layer');
  if (h.uvIndex >= 3) out.push('Sunscreen + hat');
  if (h.feelsLike >= 24) out.push('Water bottle');
  return out.length ? out : ['Nothing special, just go'];
}

// Sun times come back as local timestamps without offsets, so work in minutes of the day.
export function goldenTimes(sunrise: string, sunset: string) {
  const r = minsOf(sunrise), s = minsOf(sunset);
  return {
    blueMorning: [r - 30, r] as const,
    goldenMorning: [r, r + 60] as const,
    goldenEvening: [s - 60, s] as const,
    blueEvening: [s, s + 30] as const,
    sunrise: r, sunset: s,
  };
}
export const span = (a: readonly [number, number]) => `${clock(a[0])} to ${clock(a[1])}`;

export interface SkyHour { time: string; cloud: number; low: number; mid: number; high: number; visibility: number }
export function lightQuality(cloud: number) {
  if (cloud < 15) return 'Clear sky: clean, crisp light';
  if (cloud < 45) return 'Some cloud: nice colour potential';
  if (cloud < 75) return 'Broken cloud: could light up, or fizzle';
  return 'Overcast: flat, soft light';
}

export function nearestSky(sky: SkyHour[], minutes: number, date: string) {
  const hr = Math.floor(minutes / 60);
  return sky.find(s => dateOf(s.time) === date && Number(s.time.slice(11, 13)) === hr) ?? null;
}

export function stargazing(sky: SkyHour[], sunset: string, nextSunrise: string, illumination: number) {
  const startDate = dateOf(sunset);
  const start = minsOf(sunset) + 80;
  const hours = sky.filter(s => {
    const d = dateOf(s.time), m = minsOf(s.time);
    if (d === startDate) return m >= start;
    if (d === dateOf(nextSunrise)) return m <= minsOf(nextSunrise) - 80;
    return false;
  });
  if (!hours.length) return null;
  const moonPenalty = illumination * 0.35;
  const scored = hours.map(h => ({ ...h, score: Math.round(clamp(100 - h.cloud * 0.95 - moonPenalty - (h.visibility < 10 ? 10 : 0))) }));
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
  const avg = Math.round(scored.reduce((s, h) => s + h.score, 0) / scored.length);
  const label = best.score >= 75 ? 'Excellent' : best.score >= 55 ? 'Good' : best.score >= 35 ? 'Patchy' : 'Clouded out';
  return { hours: scored, best, avg, label, moonPenalty };
}

export const auroraKpNeeded = (lat: number) => {
  const a = Math.abs(lat);
  return a < 38 ? 7 : a < 41 ? 6 : a < 45 ? 5 : 4;
};

export interface TidePoint { time: string; level: number; kind: 'high' | 'low' }
export function tideExtrema(times: string[], levels: (number | null)[]): TidePoint[] {
  const out: TidePoint[] = [];
  for (let i = 2; i < levels.length - 2; i++) {
    const v = levels[i], p = levels[i - 1], n = levels[i + 1];
    if (v == null || p == null || n == null) continue;
    if (v > p && v >= n && v >= (levels[i - 2] ?? v) && v >= (levels[i + 2] ?? v)) out.push({ time: times[i], level: v, kind: 'high' });
    if (v < p && v <= n && v <= (levels[i - 2] ?? v) && v <= (levels[i + 2] ?? v)) out.push({ time: times[i], level: v, kind: 'low' });
  }
  return out;
}
