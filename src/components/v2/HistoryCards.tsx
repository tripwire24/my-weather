'use client';

import { useAsync } from '@/hooks/useAsync';
import { fetchHistory } from '@/lib/extraApis';
import type { Location } from '@/types/weather';

const pct = (a: number, b: number) => (b > 0.5 ? Math.round(((a - b) / b) * 100) : null);
const ordinal = (n: number) => (n === 1 ? 'wettest' : n === 2 ? '2nd wettest' : n === 3 ? '3rd wettest' : `${n}th wettest`);

export function HistoryCards({ location }: { location: Location }) {
  const key = `hist:${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
  const { data, loading, error } = useAsync(() => fetchHistory(location.latitude, location.longitude), key, 6 * 3600 * 1000);
  return <section aria-label="How this compares">
    <div className="section-heading"><h2>How this compares</h2><span className="pill">LAST 6 YEARS</span></div>
    {loading && !data && <p className="run-note">Looking back through the records…</p>}
    {error && !data && <p className="run-note">History unavailable right now.</p>}
    {data && <div className="stat-grid">
      <div className="stat-card"><span>Rain, last 30 days</span><strong>{Math.round(data.rain30)} mm</strong>
        <p>{ordinal(data.rain30Rank)} of {data.years} years for {data.label30}.{pct(data.rain30, data.rain30Avg) != null ? ` ${Math.abs(pct(data.rain30, data.rain30Avg)!)}% ${data.rain30 >= data.rain30Avg ? 'above' : 'below'} the usual ${Math.round(data.rain30Avg)} mm.` : ''}</p></div>
      <div className="stat-card"><span>Temperature, last 30 days</span><strong>{data.temp30.toFixed(1)}°</strong>
        <p>{Math.abs(data.temp30 - data.temp30Avg) < 0.3 ? 'About normal' : `${Math.abs(data.temp30 - data.temp30Avg).toFixed(1)}° ${data.temp30 > data.temp30Avg ? 'warmer' : 'cooler'} than`} {Math.abs(data.temp30 - data.temp30Avg) < 0.3 ? 'for' : 'the'} {Math.abs(data.temp30 - data.temp30Avg) < 0.3 ? 'this time of year' : `usual ${data.temp30Avg.toFixed(1)}° average`}.</p></div>
      <div className="stat-card"><span>Rain so far this year</span><strong>{Math.round(data.rainYtd)} mm</strong>
        <p>{pct(data.rainYtd, data.rainYtdAvg) != null ? `${Math.abs(pct(data.rainYtd, data.rainYtdAvg)!)}% ${data.rainYtd >= data.rainYtdAvg ? 'above' : 'below'} the ${Math.round(data.rainYtdAvg)} mm average by this date.` : 'Not much to compare yet.'}</p></div>
      {data.wettestDay && <div className="stat-card"><span>Wettest day this year</span><strong>{Math.round(data.wettestDay.mm)} mm</strong><p>{new Date(data.wettestDay.date + 'T12:00:00Z').toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}.</p></div>}
    </div>}
    <small className="run-note">Open-Meteo historical reanalysis for {location.name}. Modelled grid data, so it can differ from a nearby rain gauge.</small>
  </section>;
}
