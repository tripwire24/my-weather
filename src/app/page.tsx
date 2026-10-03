'use client';

import { useEffect, useRef, useState } from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useTheme } from '@/hooks/useTheme';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useExtraData } from '@/hooks/useExtraData';
import { LocationSearch } from '@/components/LocationSearch';
import { LiveDashboard } from '@/components/LiveDashboard';
import { HourlyForecast } from '@/components/HourlyForecast';
import { WeeklyForecast } from '@/components/WeeklyForecast';
import { WindAtmosphere } from '@/components/WindAtmosphere';
import { PrecipitationStorms } from '@/components/PrecipitationStorms';
import { SunMoon } from '@/components/SunMoon';
import { UVSolar } from '@/components/UVSolar';
import { AstronomySeasons } from '@/components/AstronomySeasons';
import { FeelsLike } from '@/components/FeelsLike';
import { AirQuality } from '@/components/AirQuality';
import { Ambient, CountUp, useLivingUI, useTilt } from '@/components/v2/Motion';
import { Radar } from '@/components/v2/Radar';
import { SkyView } from '@/components/v2/SkyTab';
import { HistoryCards } from '@/components/v2/HistoryCards';
import { AlertsCard, DaycareRun, OutsideScoreCard, notify, type AlertItem } from '@/components/v2/TodayExtras';
import { fetchRainSoon, fetchKpForecast } from '@/lib/extraApis';
import { auroraKpNeeded } from '@/lib/insights';
import { WeatherIcon } from '@/components/ui/WeatherIcon';
import { wmoLabel, formatRelativeTime } from '@/lib/formatters';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Location, WeatherData, HourlyForecast as Hour } from '@/types/weather';

const PLACES_KEY = 'sg_saved_places';
const starterPlaces: Location[] = [
  { name: 'Auckland', latitude: -36.8485, longitude: 174.7633, country: 'New Zealand', timezone: 'Pacific/Auckland' },
  { name: 'Wellington', latitude: -41.2866, longitude: 174.7756, country: 'New Zealand', timezone: 'Pacific/Auckland' },
  { name: 'Christchurch', latitude: -43.5321, longitude: 172.6362, country: 'New Zealand', timezone: 'Pacific/Auckland' },
];
const samePlace = (a: Location, b: Location) => Math.abs(a.latitude - b.latitude) < .01 && Math.abs(a.longitude - b.longitude) < .01;
const hourLabel = (time: string) => { const h = Number(time.slice(11, 13)); return `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`; };

export default function StormGridApp() {
  const { location: gps, loading: gpsLoading, error: gpsError, requestPermission } = useGeolocation();
  const [manual, setManual] = useState<Location | null>(null);
  const [search, setSearch] = useState(false);
  const [places, setPlaces] = useState<Location[]>([]);
  const [tab, setTab] = useState<'today' | 'radar' | 'forecast' | 'sky' | 'live'>('today');
  const [details, setDetails] = useState(false);
  const location = manual ?? gps;
  const { data, loading, error, isStale, lastUpdated, refresh } = useWeatherData(location);
  const { mode, setTheme } = useTheme(data?.current.weatherCode);
  useAutoRefresh(refresh, !!location);
  const extra = useExtraData(tab === 'live' ? location : null);
  useEffect(() => { queueMicrotask(() => { try { const saved = JSON.parse(localStorage.getItem(PLACES_KEY) || '[]'); if (Array.isArray(saved)) setPlaces(saved.filter(p => typeof p.name === 'string' && Number.isFinite(p.latitude) && Number.isFinite(p.longitude))); } catch {} }); }, []);
  const heroRef = useRef<HTMLElement>(null);
  useTilt(heroRef, tab === 'today' && !!data);
  useLivingUI();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [checkTick, setCheckTick] = useState(0);
  const lat = location?.latitude, lon = location?.longitude, locName = location?.name;
  useEffect(() => {
    if (lat == null || lon == null || !locName) return;
    let alive = true;
    const run = async () => {
      if (document.visibilityState === 'hidden') return;
      const targets = [{ name: locName, latitude: lat, longitude: lon }, ...places.filter(p => !samePlace(p, { name: locName, latitude: lat, longitude: lon }))].slice(0, 4);
      const found: AlertItem[] = [];
      await Promise.all(targets.map(async p => {
        try {
          const r = await fetchRainSoon(p.latitude, p.longitude);
          if (!r.raining && r.startsAt && r.inMinutes != null && r.inMinutes <= 60) {
            found.push({ id: `rain-${p.name}-${r.startsAt}`, kind: 'rain', title: `Rain at ${p.name} in about ${Math.max(5, Math.round(r.inMinutes / 5) * 5)} min`, body: `Starts around ${hourLabel(r.startsAt)}${r.startsAt.slice(14, 16) !== '00' ? ':' + r.startsAt.slice(14, 16) : ''}. Get the washing in.` });
          }
        } catch {}
      }));
      try {
        if (localStorage.getItem('sg_alerts_on') === '1') {
          const kp = await fetchKpForecast();
          const need = auroraKpNeeded(lat);
          if (kp.max24h >= need) found.push({ id: `aurora-${new Date().toISOString().slice(0, 10)}`, kind: 'aurora', title: 'Aurora possible tonight', body: `Kp ${kp.max24h.toFixed(1)} forecast, enough to see it from ${locName} if skies are clear.` });
        }
      } catch {}
      if (!alive) return;
      setAlerts(found);
      try { if (localStorage.getItem('sg_alerts_on') === '1') found.forEach(f => { notify(f); }); } catch {}
    };
    run();
    const t = setInterval(run, 10 * 60 * 1000);
    const vis = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', vis);
    return () => { alive = false; clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [lat, lon, locName, places, checkTick]);
  const select = (place: Location) => {
    setManual(place);
    try { localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(place)); } catch {}
    setSearch(false);
  };
  const toggleSave = () => {
    if (!location) return;
    const next = places.some(p => samePlace(p, location)) ? places.filter(p => !samePlace(p, location)) : [...places, location].slice(-6);
    setPlaces(next);
    try { localStorage.setItem(PLACES_KEY, JSON.stringify(next)); } catch {}
  };
  return <div className="day-app">
    <Ambient code={data?.current.weatherCode} isDay={data?.current.isDay}/>
    <header className="day-header"><a href="#main" className="day-brand"><span className="brand-orbit">◎</span> StormGrid<span className="brand-note">A little more outside.</span></a>
      <div className="header-actions"><button aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} theme`} onClick={() => setTheme(mode === 'light' ? 'dark' : 'light')}>{mode === 'light' ? '◐' : '☀'}</button><button aria-label="Refresh forecast" disabled={loading || !location} onClick={refresh}>↻</button></div>
    </header>
    <main id="main" className="day-main">
      <div className="day-toolbar"><button className="place-button" onClick={() => setSearch(true)}>⌖ {location?.name || 'Choose your place'} <span>⌄</span></button>{location && <button className="save-button" onClick={toggleSave} aria-label={places.some(p=>samePlace(p,location)) ? 'Unsave this place' : 'Save this place'}>{places.some(p=>samePlace(p,location)) ? '★ Saved' : '☆ Save'}</button>}</div>
      {places.length > 0 && <div className="place-chips" aria-label="Saved places">{places.map(p=><button className={location && samePlace(p,location) ? 'selected' : ''} key={`${p.latitude},${p.longitude}`} onClick={()=>select(p)}>{p.name}</button>)}</div>}
      {!location && <section className="welcome-card"><p className="eyebrow">YOUR DAY, NOT JUST THE NUMBERS</p><h1>Make room<br/>for outside.</h1><p>Know when the rain arrives, find a calmer window, and take the day as it comes.</p><button className="primary-button" onClick={()=>setSearch(true)}>Find your forecast <span>↗</span></button><button className="text-button" onClick={requestPermission} disabled={gpsLoading}>{gpsLoading ? 'Finding your location…' : 'Use my current location'}</button><div className="starter-places">{starterPlaces.map(p=><button key={p.name} onClick={()=>select(p)}>{p.name} ↗</button>)}</div><small>No location permission needed. Places you save stay on this device.</small></section>}
      {gpsError && <div role="status" className="notice">{gpsError} <button onClick={()=>setSearch(true)}>Search instead</button></div>}
      {error && <div role="alert" className="notice">{data ? 'Showing a saved forecast. ' : ''}{error} <button onClick={refresh}>Try again</button></div>}
      {loading && !data && <section className="loading-card" role="status"><div className="sg-skeleton"/><h2>Getting your forecast</h2><p>Rain, wind and the next good window for {location?.name}.</p></section>}
      {data && <>
        <div className="forecast-status" role="status">{loading ? 'Updating forecast…' : isStale ? 'Saved forecast · may be out of date' : `Updated ${lastUpdated ? formatRelativeTime(lastUpdated) : 'just now'}`}<span>Open-Meteo · {data.location.timezone || 'local time'}</span></div>
        {tab === 'today' && <>
          <section ref={heroRef} className={`now-card ${data.current.isDay ? 'is-day' : 'is-night'}`}><div className="hero-sky" aria-hidden="true"><i className="cloud c1"/><i className="cloud c2"/><i className="cloud c3"/><i className="glare"/></div><div><p className="eyebrow">RIGHT NOW</p><h1>{wmoLabel(data.current.weatherCode)}</h1><p>Feels like {Math.round(data.current.feelsLike)}° · High {Math.round(data.daily[0]?.tempMax)}° / Low {Math.round(data.daily[0]?.tempMin)}°</p></div><div className="temperature-row"><div className="holo" aria-hidden="true">{[0,30,60,90,120,150].map(a=><i key={a} style={{transform:`rotateY(${a}deg)`}}/>)}{[-.44,-.28,0,.28,.44].map(z=><b key={z} style={{transform:`rotateX(90deg) translateZ(calc(var(--s) * ${z})) scale(${Math.sqrt(1-4*z*z).toFixed(3)})`}}/>)}</div><span className="big-temperature"><CountUp value={Math.round(data.current.temperature)}/><sup>°</sup></span><WeatherIcon code={data.current.weatherCode} isDay={data.current.isDay} size={96}/></div><div className="now-metrics"><div><span>Wind</span><strong><CountUp value={Math.round(data.current.windSpeed)}/> <small>km/h</small></strong></div><div><span>Rain today</span><strong>{data.daily[0]?.precipitation.toFixed(1)} <small>mm</small></strong></div><div><span>UV now</span><strong>{data.current.uvIndex.toFixed(1)} <small>{data.current.uvIndex >= 3 ? 'Protection' : 'Low'}</small></strong></div></div></section>
          <DayPlanner data={data}/>
          <OutsideScoreCard data={data}/>
          <DaycareRun data={data}/>
          <AlertsCard items={alerts} places={places} location={location} onCheck={() => setCheckTick(t => t + 1)}/>
          <div className="section-heading"><h2>The next 48 hours</h2><button onClick={()=>setTab('forecast')}>See the week ↗</button></div><HourlyForecast hourly={data.hourly}/>
          <button className="details-button" onClick={()=>setDetails(!details)} aria-expanded={details}>{details ? '− Less detail' : '+ Weather nerd mode'}<span>Wind, UV, sun, moon & air quality</span></button>
          {details && <div className="detail-grid"><WindAtmosphere current={data.current} pressureTrend={data.hourly.length > 3 ? (data.hourly[3].pressure - data.hourly[0].pressure > 1 ? "rising" : data.hourly[3].pressure - data.hourly[0].pressure < -1 ? "falling" : "steady") : "steady"}/><PrecipitationStorms current={data.current} hourly={data.hourly} dailyPrecipTotal={data.daily[0]?.precipitation ?? 0}/><UVSolar current={data.current} hourly={data.hourly} solarNoon={data.sun.solarNoon}/><SunMoon sun={data.sun} moon={data.moon}/><AstronomySeasons astronomy={data.astronomy} dayLength={data.sun.dayLength}/><FeelsLike current={data.current}/>{data.airQuality && <AirQuality airQuality={data.airQuality}/>}</div>}
        </>}
        {tab === 'radar' && <><div className="section-heading"><h1>What's coming.</h1></div><Radar location={data.location} mode={mode === 'light' ? 'light' : 'dark'}/></>}
        {tab === 'forecast' && <><div className="section-heading"><h1>A week of possibilities.</h1></div><WeeklyForecast daily={data.daily}/><HistoryCards location={data.location}/><div className="section-heading"><h2>Hour by hour</h2></div><HourlyForecast hourly={data.hourly}/></>}
        {tab === 'sky' && <SkyView data={data}/>}
        {tab === 'live' && <><div className="section-heading"><h1>Beyond the forecast.</h1></div><LiveDashboard data={extra.data} loading={extra.loading} onRefresh={extra.refresh} location={data.location} weather={data}/></>}
        <footer className="day-footer">Model forecasts, not official weather warnings. Conditions can change.<br/><a href="https://www.metservice.com/warnings/home">Check MetService NZ warnings ↗</a></footer>
      </>}
    </main>
    <nav className="day-nav" aria-label="Forecast views"><i className="nav-glow" aria-hidden="true" style={{ transform: `translateX(${(['today','radar','forecast','sky','live'] as const).indexOf(tab) * 100}%)` }}/>{(['today','radar','forecast','sky','live'] as const).map((t,i)=><button key={t} className={tab === t ? 'active' : ''} aria-current={tab === t ? 'page' : undefined} onClick={()=>setTab(t)}><span>{['◉','☂','▤','✦','◎'][i]}</span>{['Today','Radar','Week','Sky','Live'][i]}</button>)}</nav>
    {search && <LocationSearch onSelect={select} onClose={()=>setSearch(false)} onRequestGps={()=>{ setManual(null); requestPermission(); }}/>}
  </div>;
}

function DayPlanner({ data }: { data: WeatherData }) {
  const [activity, setActivity] = useState<'walk'|'washing'|'cycling'>('walk');
  const hours = data.hourly.slice(0,24);
  const limits = { walk: { rain: 30, wind: 25, gust: 40, duration: 2 }, washing: { rain: 20, wind: 30, gust: 45, duration: 3 }, cycling: { rain: 20, wind: 20, gust: 35, duration: 2 } }[activity];
  const ok = (h: Hour) => h.isDay && h.precipitationProbability <= limits.rain && h.precipitation < .2 && h.windSpeed <= limits.wind && h.windGusts <= limits.gust;
  const start = hours.findIndex((_,i)=>hours.slice(i,i+limits.duration).length === limits.duration && hours.slice(i,i+limits.duration).every(ok));
  const window = start >= 0 ? hours.slice(start,start+limits.duration) : [];
  const rain = hours.find(h=>h.precipitationProbability >= 50 || h.precipitation >= .5);
  const maxChance = hours.length ? Math.max(...hours.map(h=>h.precipitationProbability)) : 0;
  return <section className="planner-card"><div className="section-heading"><h2>Your outside window</h2><span className="pill">NEXT 24H</span></div><div className="activity-tabs" aria-label="Choose activity">{(['walk','washing','cycling'] as const).map(a=><button key={a} aria-pressed={activity === a} className={activity === a ? 'active' : ''} onClick={()=>setActivity(a)}>{a === 'walk' ? '↗ A walk' : a === 'washing' ? '☀ Washing' : '↝ A ride'}</button>)}</div><div className="window-result"><span className="window-mark">{window.length ? '↗' : '☂'}</span><div><h3>{window.length ? `${hourLabel(window[0].time)}–${hourLabel(window[window.length-1].time.replace(/T(\d{2})/, (_,h)=>`T${String((Number(h)+1)%24).padStart(2,'0')}`))}` : 'No clear window yet'}</h3><p>{window.length ? `${window[0].time.slice(0,10) === hours[0]?.time.slice(0,10) ? 'Today' : 'Tomorrow'} · ${Math.round(Math.min(...window.map(h=>h.temperature)))}–${Math.round(Math.max(...window.map(h=>h.temperature)))}° · up to ${Math.max(...window.map(h=>h.precipitationProbability))}% rain chance` : 'Try another activity or check again later.'}</p></div></div><p className="rain-summary">{rain ? `Rain looks more likely around ${hourLabel(rain.time)}${rain.time.slice(0,10) !== hours[0]?.time.slice(0,10) ? ' tomorrow' : ''}.` : `No strong rain signal in the next 24 hours (${maxChance}% peak chance).`}</p><div className="rain-strip" aria-label="Hourly rain probability over the next 12 hours">{hours.slice(0,12).map((h,i)=><div key={h.time} title={`${hourLabel(h.time)}: ${h.precipitationProbability}% chance`}><span>{h.precipitationProbability}%</span><div className="rain-bar"><i style={{height:`${Math.max(4,h.precipitationProbability)}%`,['--i' as string]:i}}/></div><small>{hourLabel(h.time)}</small></div>)}</div><details className="planner-method"><summary>How this window is picked</summary><p>{limits.duration} consecutive daylight hours, rain chance ≤{limits.rain}%, rain &lt;0.2 mm/h, wind ≤{limits.wind} km/h and gusts ≤{limits.gust} km/h. {activity === 'washing' ? 'A dry window, not a drying-time guarantee. ' : ''}UV, road and local conditions still matter. This is a forecast estimate, not safety advice.</p></details></section>;
}
