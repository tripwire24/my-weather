'use client';

import { useAsync } from '@/hooks/useAsync';
import { fetchGeoNetQuakes, fetchTides } from '@/lib/extraApis';
import { clock, minsOf, dateOf } from '@/lib/insights';
import { AuroraCard } from '@/components/v2/SkyTab';
import type { Location, WeatherData } from '@/types/weather';

const inNZ = (l: Location) => l.latitude < -33 && l.latitude > -48.5 && l.longitude > 165 && l.longitude < 180;
const ago = (t: number) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

export function TidesCard({ location }: { location: Location }) {
  const { data, loading, error } = useAsync(() => fetchTides(location.latitude, location.longitude), `tide:${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`, 30 * 60 * 1000);
  const nowStamp = new Date().toLocaleString('sv-SE', { timeZone: location.timezone || 'Pacific/Auckland' }).replace(' ', 'T').slice(0, 16);
  const next = data?.extrema.filter(e => e.time >= nowStamp).slice(0, 4) ?? [];
  const i0 = data ? Math.max(0, data.times.findIndex(t => t >= nowStamp.slice(0, 13))) : 0;
  const pts = data ? data.levels.slice(i0, i0 + 30) : [];
  const mn = Math.min(...pts, 0), mx = Math.max(...pts, 0.1);
  const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / Math.max(1, pts.length - 1)) * 300},${58 - ((v - mn) / (mx - mn || 1)) * 52}`).join(' ');
  return <section className="v2-card" aria-label="Tides">
    <div className="section-heading"><h2>Tides</h2><span className="pill">NEXT 30H</span></div>
    {loading && !data && <p className="run-note">Reading the sea…</p>}
    {error && !data && <p className="run-note">Tide model unavailable right now.</p>}
    {data && !data.available && <p className="run-note">No coastal tide data at {location.name}. Pick a coastal place to see tides.</p>}
    {data?.available && <>
      <svg viewBox="0 0 300 64" className="tide-curve" aria-hidden="true"><path d={path} /></svg>
      <div className="tide-list">{next.map(t => <div key={t.time} className={t.kind}><span>{t.kind === 'high' ? 'High' : 'Low'}</span><strong>{clock(minsOf(t.time))}</strong><small>{dateOf(t.time) === nowStamp.slice(0, 10) ? 'today' : 'tomorrow'} · {t.level.toFixed(1)} m</small></div>)}</div>
      <small className="run-note">Model sea level from Open-Meteo, relative to mean sea level and rounded to the nearest hour. Local harbour tide tables (LINZ) are the reference for boating and fishing.</small>
    </>}
  </section>;
}

export function GeoNetCard({ location }: { location: Location }) {
  const nz = inNZ(location);
  const { data, loading, error } = useAsync(() => fetchGeoNetQuakes(location.latitude, location.longitude), nz ? `geonet:${location.latitude.toFixed(1)},${location.longitude.toFixed(1)}` : null, 5 * 60 * 1000);
  if (!nz) return null;
  return <section className="v2-card" aria-label="GeoNet felt quakes">
    <div className="section-heading"><h2>Felt quakes</h2><span className="pill">GEONET</span></div>
    {loading && !data && <p className="run-note">Asking GeoNet…</p>}
    {error && !data && <p className="run-note">GeoNet unavailable right now.</p>}
    {data && !data.length && <p className="run-note">No felt quakes reported recently.</p>}
    {data && data.length > 0 && <ul className="quake-list">{data.slice(0, 6).map(q => <li key={q.id}><b className={q.magnitude >= 5 ? 'big' : q.magnitude >= 4 ? 'mid' : ''}>{q.magnitude.toFixed(1)}</b><div><strong>{q.locality}</strong><small>{ago(q.time)} · {q.depth} km deep · {q.distanceKm} km from {location.name}</small></div></li>)}</ul>}
    <small className="run-note">Quakes people felt (intensity 3 or more), newest first, from GeoNet. Latest official detail: geonet.org.nz.</small>
  </section>;
}

export function LiveExtras({ data }: { data: WeatherData }) {
  return <div className="live-extras">
    <AuroraCard data={data} />
    <TidesCard location={data.location} />
    <GeoNetCard location={data.location} />
  </div>;
}
