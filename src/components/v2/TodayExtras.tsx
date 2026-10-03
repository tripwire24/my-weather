'use client';

import { useCallback, useEffect, useState } from 'react';
import { WeatherIcon } from '@/components/ui/WeatherIcon';
import { wmoLabel } from '@/lib/formatters';
import { bestWindow, clock, dateOf, hourName, minsOf, packList, scoreHour, type OutsideMode } from '@/lib/insights';
import type { Location, WeatherData } from '@/types/weather';

const load = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const save = (key: string, v: string) => { try { localStorage.setItem(key, v); } catch {} };

export function OutsideScoreCard({ data }: { data: WeatherData }) {
  const [mode, setMode] = useState<OutsideMode>('dog');
  useEffect(() => { queueMicrotask(() => { const m = load('sg_outside_mode'); if (m === 'dog' || m === 'kids') setMode(m); }); }, []);
  const pick = (m: OutsideMode) => { setMode(m); save('sg_outside_mode', m); };
  const hours = data.hourly.slice(0, 24);
  if (!hours.length) return null;
  const now = scoreHour(hours[0], mode);
  const win = bestWindow(hours, mode, 2);
  const bestHours = win ? hours.slice(win.start, win.start + win.span) : [];
  const winLabel = bestHours.length ? `${hourName(bestHours[0].time)} to ${clock(minsOf(bestHours[bestHours.length - 1].time) + 60)}` : null;
  const winDay = bestHours.length && dateOf(bestHours[0].time) !== dateOf(hours[0].time) ? 'tomorrow' : 'today';
  return <section className="v2-card" aria-label="Outside score">
    <div className="section-heading"><h2>Outside score</h2><span className="pill">NEXT 24H</span></div>
    <div className="activity-tabs" aria-label="Who is going out">
      <button className={mode === 'dog' ? 'active' : ''} aria-pressed={mode === 'dog'} onClick={() => pick('dog')}>Dog walk</button>
      <button className={mode === 'kids' ? 'active' : ''} aria-pressed={mode === 'kids'} onClick={() => pick('kids')}>Kids outside</button>
    </div>
    <div className="score-row">
      <div className={`score-ring tone-${now.tone}`} style={{ ['--pct' as string]: `${now.score * 3.6}deg` }}><div><strong>{now.score}</strong><small>/100</small></div></div>
      <div>
        <h3>{now.label} right now</h3>
        <p>{now.reasons.length ? now.reasons.join(' · ') : 'Nothing working against you.'}</p>
        {winLabel && <p className="score-best">Best window {winDay}: <strong>{winLabel}</strong> (avg {win?.avg})</p>}
      </div>
    </div>
    <div className="score-strip" aria-label="Hourly outside score for the next 24 hours">
      {hours.map((h, i) => { const s = scoreHour(h, mode); return <div key={h.time} title={`${hourName(h.time)}: ${s.score} (${s.label})`}><i className={`tone-${s.tone}`} style={{ height: `${Math.max(8, s.score)}%` }} /><small>{i % 3 === 0 ? hourName(h.time).replace(/(am|pm)/, '') : ''}</small></div>; })}
    </div>
    <details className="planner-method"><summary>How the score works</summary><p>Starts at 100 and loses points for rain chance and amount, gusty wind, feels-like temperature outside a comfort range ({mode === 'dog' ? '7 to 21°' : '12 to 25°'}), strong UV{mode === 'kids' ? ' (kids lose more)' : ''} and darkness. A forecast guide, not a safety rule. Pavement can burn paws on hot sunny days.</p></details>
  </section>;
}

const RUN_TIMES = [{ l: '7:00am', m: 420 }, { l: '7:30am', m: 450 }, { l: '8:00am', m: 480 }, { l: '8:30am', m: 510 }, { l: '3:00pm', m: 900 }, { l: '5:30pm', m: 1050 }];

export function DaycareRun({ data }: { data: WeatherData }) {
  const [mins, setMins] = useState(450);
  useEffect(() => { queueMicrotask(() => { const v = Number(load('sg_run_time')); if (RUN_TIMES.some(t => t.m === v)) setMins(v); }); }, []);
  const pick = (m: number) => { setMins(m); save('sg_run_time', String(m)); };
  const first = data.hourly[0];
  if (!first) return null;
  const nowMin = minsOf(first.time), nowDate = dateOf(first.time);
  const hr = Math.floor(mins / 60);
  const isToday = hr * 60 >= nowMin;
  const targetDate = isToday ? nowDate : new Date(new Date(nowDate + 'T12:00:00Z').getTime() + 86400e3).toISOString().slice(0, 10);
  const idx = data.hourly.findIndex(h => dateOf(h.time) === targetDate && Number(h.time.slice(11, 13)) === hr);
  const h = idx >= 0 ? data.hourly[idx] : null;
  const around = h ? [data.hourly[idx - 1], h, data.hourly[idx + 1]].filter(Boolean) : [];
  const verdict = !h ? '' : h.precipitationProbability >= 50 || h.precipitation >= 0.3 ? 'Wet walk-out. Raincoats and boots on.' : h.precipitationProbability >= 25 ? 'Could spit. Keep a raincoat handy.' : h.windGusts >= 45 ? 'Dry but blustery.' : 'Dry walk-out.';
  return <section className="v2-card daycare" aria-label="Daycare run">
    <div className="section-heading"><h2>Daycare run</h2><span className="pill">{isToday ? 'TODAY' : 'TOMORROW'} · {clock(mins)}</span></div>
    <div className="chip-row" aria-label="Pick a run time">{RUN_TIMES.map(t => <button key={t.m} className={mins === t.m ? 'active' : ''} aria-pressed={mins === t.m} onClick={() => pick(t.m)}>{t.l}</button>)}</div>
    {h ? <>
      <div className="run-main"><WeatherIcon code={h.weatherCode} isDay={h.isDay} size={64} /><div><h3>{Math.round(h.temperature)}° <small>feels {Math.round(h.feelsLike)}°</small></h3><p>{wmoLabel(h.weatherCode)} · {h.precipitationProbability}% rain · wind {Math.round(h.windSpeed)} km/h</p></div></div>
      <p className="run-verdict">{verdict}</p>
      <div className="run-around">{around.map(a => <div key={a.time} className={a.time === h.time ? 'on' : ''}><span>{hourName(a.time)}</span><strong>{Math.round(a.temperature)}°</strong><small>{a.precipitationProbability}% rain</small></div>)}</div>
      <div className="pack-list" aria-label="What to pack">{packList(h).map(p => <span key={p}>{p}</span>)}</div>
      <small className="run-note">Forecast for {data.location.name}, the hour starting {hourName(h.time)}.</small>
    </> : <p className="run-note">That hour is outside the forecast window right now.</p>}
  </section>;
}

export interface AlertItem { id: string; kind: 'rain' | 'aurora'; title: string; body: string }
const ALERT_KEY = 'sg_alerts_on';
const SENT_KEY = 'sg_alerts_sent';

async function notify(item: AlertItem) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const sent: string[] = (() => { try { return JSON.parse(load(SENT_KEY) || '[]'); } catch { return []; } })();
  if (sent.includes(item.id)) return;
  save(SENT_KEY, JSON.stringify([...sent.slice(-30), item.id]));
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) await reg.showNotification(item.title, { body: item.body, tag: item.id, icon: '/icons/icon-192.svg', badge: '/icons/icon-192.svg' });
    else new Notification(item.title, { body: item.body, tag: item.id });
  } catch { try { new Notification(item.title, { body: item.body, tag: item.id }); } catch {} }
}

export function AlertsCard({ items, places, location, onCheck }: { items: AlertItem[]; places: Location[]; location: Location | null; onCheck: () => void }) {
  const [on, setOn] = useState(false);
  const [perm, setPerm] = useState<string>('default');
  useEffect(() => { queueMicrotask(() => { setOn(load(ALERT_KEY) === '1'); setPerm(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission); }); }, []);
  const syncSw = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker?.ready; if (!reg) return;
      const list = [...(location ? [location] : []), ...places].slice(0, 5).map(p => ({ name: p.name, latitude: p.latitude, longitude: p.longitude }));
      const c = await caches.open('stormgrid-alerts'); await c.put('/__alert_places', new Response(JSON.stringify(list)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ps = (reg as any).periodicSync; if (ps) await ps.register('stormgrid-rain-check', { minInterval: 30 * 60 * 1000 });
    } catch {}
  }, [location, places]);
  useEffect(() => { if (on) queueMicrotask(() => { syncSw(); }); }, [on, syncSw]);
  const toggle = async () => {
    if (on) { setOn(false); save(ALERT_KEY, '0'); return; }
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') { const r = await Notification.requestPermission(); setPerm(r); }
    else if (typeof Notification !== 'undefined') setPerm(Notification.permission);
    setOn(true); save(ALERT_KEY, '1'); onCheck();
  };
  return <section className="v2-card alerts" aria-label="Rain alerts">
    <div className="section-heading"><h2>Rain alerts</h2><button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={toggle}><i />{on ? 'On' : 'Off'}</button></div>
    {items.length > 0 ? <ul className="alert-list">{items.map(a => <li key={a.id} className={a.kind}><strong>{a.title}</strong><span>{a.body}</span></li>)}</ul> : <p className="run-note">{on ? 'Nothing heading your way in the next hour.' : 'Turn on to get a heads-up when rain is about to start at your current or saved places.'}</p>}
    <details className="planner-method"><summary>How alerts work</summary><p>While StormGrid is open, it checks 15-minute rain forecasts for this place and your saved places every 10 minutes and warns you up to an hour ahead. {perm === 'granted' ? 'Notifications are allowed on this device.' : perm === 'denied' ? 'Notifications are blocked in your browser settings, so you will only see alerts here in the app.' : perm === 'unsupported' ? 'This browser has no notifications, so alerts show here in the app.' : 'Allow notifications when asked to get them on your lock screen.'} Alerts while the app is fully closed need a push server, which is not set up yet. Chrome on Android can sometimes run them in the background if the app is installed.</p></details>
  </section>;
}

export { notify };
