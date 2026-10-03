'use client';

import { useAsync } from '@/hooks/useAsync';
import { fetchKpForecast, fetchSky, fetchSpaceWeather } from '@/lib/extraApis';
import { auroraKpNeeded, clock, dateOf, goldenTimes, lightQuality, minsOf, nearestSky, span, stargazing } from '@/lib/insights';
import { MoonSphere } from '@/components/v2/Motion';
import type { WeatherData } from '@/types/weather';

export function GoldenHourCard({ data }: { data: WeatherData }) {
  const { data: sky } = useAsync(() => fetchSky(data.location.latitude, data.location.longitude), `sky:${data.location.latitude.toFixed(2)},${data.location.longitude.toFixed(2)}`, 20 * 60 * 1000);
  const days = data.daily.slice(0, 2);
  return <section className="v2-card" aria-label="Golden hour">
    <div className="section-heading"><h2>Golden hour</h2><span className="pill">PHOTO LIGHT</span></div>
    {days.map((d, i) => {
      const g = goldenTimes(d.sunrise, d.sunset);
      const date = dateOf(d.sunset);
      const eve = sky ? nearestSky(sky, g.sunset - 30, date) : null;
      const morn = sky ? nearestSky(sky, g.sunrise, dateOf(d.sunrise)) : null;
      return <div className="golden-day" key={d.date}>
        <h3>{i === 0 ? 'Today' : 'Tomorrow'}</h3>
        <div className="golden-bar" aria-hidden="true"><i style={{ left: `${(g.sunrise - 30) / 14.4}%`, width: `${90 / 14.4}%` }} /><i className="eve" style={{ left: `${(g.sunset - 60) / 14.4}%`, width: `${90 / 14.4}%` }} /></div>
        <div className="golden-grid">
          <div><span>Morning golden</span><strong>{span(g.goldenMorning)}</strong><small>{morn ? lightQuality(morn.cloud) : `Sunrise ${clock(g.sunrise)}`}</small></div>
          <div><span>Evening golden</span><strong>{span(g.goldenEvening)}</strong><small>{eve ? lightQuality(eve.cloud) : `Sunset ${clock(g.sunset)}`}</small></div>
          <div><span>Blue hour</span><strong>{clock(g.blueEvening[0])} to {clock(g.blueEvening[1])}</strong><small>after sunset</small></div>
        </div>
      </div>;
    })}
  </section>;
}

export function StargazingCard({ data }: { data: WeatherData }) {
  const { data: sky, loading, error } = useAsync(() => fetchSky(data.location.latitude, data.location.longitude), `sky:${data.location.latitude.toFixed(2)},${data.location.longitude.toFixed(2)}`, 20 * 60 * 1000);
  const d0 = data.daily[0], d1 = data.daily[1];
  const from = data.hourly[0]?.time ?? '';
  const res = sky && d0 && d1 ? stargazing(sky.filter(x => x.time >= from), d0.sunset, d1.sunrise, data.moon.illumination) : null;
  return <section className="v2-card" aria-label="Stargazing forecast">
    <div className="section-heading"><h2>Stargazing</h2><span className="pill">TONIGHT</span></div>
    {loading && !sky && <p className="run-note">Reading the clouds…</p>}
    {error && !sky && <p className="run-note">Cloud forecast unavailable: {error}</p>}
    {res && <>
      <div className="score-row"><div className={`score-ring tone-${res.best.score >= 75 ? 'great' : res.best.score >= 55 ? 'good' : res.best.score >= 35 ? 'meh' : 'bad'}`} style={{ ['--pct' as string]: `${res.best.score * 3.6}deg` }}><div><strong>{res.best.score}</strong><small>best</small></div></div>
        <div><h3>{res.label}</h3><p>Best around <strong>{clock(minsOf(res.best.time))}</strong> with {Math.round(res.best.cloud)}% cloud. Moon {Math.round(data.moon.illumination)}% lit ({data.moon.phaseName.toLowerCase()}).</p></div></div>
      <div className="moon-row"><MoonSphere phase={data.moon.phase} /><div><strong>{data.moon.phaseName}</strong><span>{Math.round(data.moon.illumination)}% lit · costs {Math.round(res.moonPenalty)} points of darkness</span></div></div>
      <div className="star-strip" aria-label="Cloud cover through the night">{res.hours.map((h, i) => <div key={h.time} title={`${clock(minsOf(h.time))}: ${Math.round(h.cloud)}% cloud`}><i style={{ height: `${Math.max(6, 100 - h.cloud)}%`, ['--i' as string]: i }} /><small>{Number(h.time.slice(11, 13)) % 2 === 0 ? clock(minsOf(h.time)).replace(/(am|pm)/, '') : ''}</small></div>)}</div>
      <small className="run-note">Taller bars mean clearer sky. Score is clear sky minus a moonlight penalty ({Math.round(res.moonPenalty)} points tonight), counted from about 80 minutes after sunset to 80 minutes before sunrise.</small>
    </>}
    {!res && sky && <p className="run-note">Not enough night hours in the forecast yet.</p>}
  </section>;
}

export function AuroraCard({ data }: { data: WeatherData }) {
  const lat = data.location.latitude;
  const kp = useAsync(fetchKpForecast, 'kpf', 15 * 60 * 1000);
  const now = useAsync(fetchSpaceWeather, 'kpnow', 5 * 60 * 1000);
  const sky = useAsync(() => fetchSky(lat, data.location.longitude), `sky:${lat.toFixed(2)},${data.location.longitude.toFixed(2)}`, 20 * 60 * 1000);
  const need = auroraKpNeeded(lat);
  const cur = now.data?.kpIndex ?? 0;
  const peak = Math.max(kp.data?.max24h ?? 0, cur);
  const watch = peak >= need;
  const d0 = data.daily[0];
  const dark = sky.data && d0 ? sky.data.filter(s => dateOf(s.time) === dateOf(d0.sunset) && minsOf(s.time) >= minsOf(d0.sunset) + 80) : [];
  const cloud = dark.length ? Math.round(dark.reduce((s, h) => s + h.cloud, 0) / dark.length) : null;
  return <section className={`v2-card aurora ${watch ? 'watch' : ''}`} aria-label="Aurora outlook">
    <div className="section-heading"><h2>Aurora outlook</h2><span className="pill">{watch ? 'WATCH' : 'QUIET'}</span></div>
    {(kp.loading || now.loading) && !kp.data && !now.data && <p className="run-note">Checking space weather…</p>}
    {(kp.data || now.data) && <>
      <div className="run-main"><div className="kp-badge">{peak.toFixed(1)}<small>Kp</small></div><div>
        <h3>{watch ? 'Aurora is possible' : 'Not tonight'}</h3>
        <p>{watch ? `Kp ${peak.toFixed(1)} meets the roughly Kp ${need}+ needed at ${data.location.name}'s latitude. Look south, away from lights.${cloud != null ? ` Tonight's average cloud: ${cloud}%.` : ''}` : `At ${data.location.name}'s latitude you usually need Kp ${need}+. Now ${cur.toFixed(1)}, forecast peak ${(kp.data?.max24h ?? 0).toFixed(1)} over 24 hours.`}</p></div></div>
      {kp.data && <div className="kp-strip" aria-label="Planetary Kp index forecast">{kp.data.series.map((s, i) => <div key={s.time} title={`${s.kp} Kp`}><i className={s.kp >= need ? 'hot' : ''} style={{ height: `${Math.max(6, (s.kp / 9) * 100)}%`, ['--i' as string]: i }} /></div>)}</div>}
      <small className="run-note">Kp from NOAA SWPC. Your threshold is a rule of thumb, local geomagnetic latitude and a clear southern horizon matter more.</small>
    </>}
  </section>;
}

export function SkyView({ data }: { data: WeatherData }) {
  return <>
    <div className="section-heading"><h1>Look up.</h1></div>
    <GoldenHourCard data={data} />
    <StargazingCard data={data} />
    <AuroraCard data={data} />
  </>;
}
