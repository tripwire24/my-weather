'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { fetchRadarFrames } from '@/lib/extraApis';
import type { Location } from '@/types/weather';

const TILE = 256;
const project = (lat: number, lon: number, z: number) => {
  const scale = TILE * 2 ** z, s = Math.sin((lat * Math.PI) / 180);
  return { x: ((lon + 180) / 360) * scale, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale };
};

export function Radar({ location, mode }: { location: Location; mode: 'dark' | 'light' }) {
  const { data, loading, error, refresh } = useAsync(fetchRadarFrames, 'radar', 4 * 60 * 1000);
  const [z, setZ] = useState(6);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [w, setW] = useState(360);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const H = 400;
  const frames = data?.frames ?? [];
  const last = frames.length - 1;

  useEffect(() => { queueMicrotask(() => { setPan({ x: 0, y: 0 }); }); }, [location.latitude, location.longitude]);
  useEffect(() => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) queueMicrotask(() => setPlaying(false)); }, []);
  useEffect(() => { if (last >= 0) queueMicrotask(() => setIdx(last)); }, [last]);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 360)); ro.observe(el); queueMicrotask(() => setW(el.clientWidth || 360));
    return () => ro.disconnect();
  }, [data]);
  useEffect(() => {
    if (!playing || last < 1) return;
    const t = setTimeout(() => setIdx(i => (i >= last ? 0 : i + 1)), idx >= last ? 1600 : 650);
    return () => clearTimeout(t);
  }, [playing, idx, last]);

  const c = project(location.latitude, location.longitude, z);
  const ox = c.x - w / 2 - pan.x, oy = c.y - H / 2 - pan.y;
  const tiles = useMemo(() => {
    const n = 2 ** z, out: { key: string; x: number; y: number; left: number; top: number }[] = [];
    for (let ty = Math.floor(oy / TILE); ty <= Math.floor((oy + H) / TILE); ty++) {
      if (ty < 0 || ty >= n) continue;
      for (let tx = Math.floor(ox / TILE); tx <= Math.floor((ox + w) / TILE); tx++) {
        out.push({ key: `${tx},${ty}`, x: ((tx % n) + n) % n, y: ty, left: Math.round(tx * TILE - ox), top: Math.round(ty * TILE - oy) });
      }
    }
    return out;
  }, [ox, oy, w, z]);

  const frame = frames[idx];
  const tz = location.timezone || 'Pacific/Auckland';
  const fmt = (t: number) => new Date(t * 1000).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', timeZone: tz });
  const ago = frame && last >= 0 ? Math.round((frames[last].time - frame.time) / 60) : 0;
  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { const d = drag.current; if (d) setPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }); };
  const onUp = () => { drag.current = null; };
  const step = useCallback((d: number) => { setPlaying(false); setIdx(i => Math.min(last, Math.max(0, i + d))); }, [last]);
  const base = mode === 'light' ? 'Light_Gray' : 'Dark_Gray';

  return <section className="v2-card radar-card" aria-label="Rain radar">
    <div className="section-heading"><h2>Rain radar</h2><span className="pill">{frame ? (ago === 0 ? 'LATEST' : `${ago} MIN AGO`) : 'LOADING'}</span></div>
    <div ref={box} className="radar-map" style={{ height: H }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} role="img" aria-label={`Animated rain radar around ${location.name}. Drag to move the map.`}>
      {tiles.map(t => <img key={'b' + t.key} alt="" draggable={false} className="radar-tile" style={{ left: t.left, top: t.top }} src={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${base}_Base/MapServer/tile/${z}/${t.y}/${t.x}`} />)}
      {data && frames.map((f, i) => <div key={f.time} className="radar-layer" style={{ opacity: i === idx ? 0.85 : 0 }}>{tiles.map(t => <img key={t.key} alt="" draggable={false} className="radar-tile" style={{ left: t.left, top: t.top }} src={`${data.host}${f.path}/256/${z}/${t.x}/${t.y}/2/1_1.png`} />)}</div>)}
      <div className="radar-layer">{tiles.map(t => <img key={'l' + t.key} alt="" draggable={false} className="radar-tile" style={{ left: t.left, top: t.top }} src={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${base}_Reference/MapServer/tile/${z}/${t.y}/${t.x}`} />)}</div>
      <div className="radar-pin" style={{ left: w / 2 + pan.x, top: H / 2 + pan.y }}><i /><span>{location.name}</span></div>
      {loading && !data && <div className="radar-msg">Loading radar…</div>}
      {error && !data && <div className="radar-msg">Radar is not available right now. <button onClick={refresh}>Try again</button></div>}
      <div className="radar-zoom"><button aria-label="Zoom in" disabled={z >= 7} onClick={() => setZ(v => Math.min(7, v + 1))}>+</button><button aria-label="Zoom out" disabled={z <= 4} onClick={() => setZ(v => Math.max(4, v - 1))}>−</button></div>
    </div>
    <div className="radar-controls">
      <button aria-label={playing ? 'Pause' : 'Play'} className="play" onClick={() => setPlaying(p => !p)}>{playing ? '❚❚' : '▶'}</button>
      <button aria-label="Previous frame" onClick={() => step(-1)}>‹</button>
      <input type="range" min={0} max={Math.max(0, last)} value={idx} aria-label="Radar time" onChange={e => { setPlaying(false); setIdx(Number(e.target.value)); }} />
      <button aria-label="Next frame" onClick={() => step(1)}>›</button>
      <strong>{frame ? fmt(frame.time) : '--'}</strong>
    </div>
    <div className="radar-legend"><span>Light</span><i /><span>Heavy</span><button onClick={() => { setPan({ x: 0, y: 0 }); }}>Recenter</button><button onClick={refresh}>Refresh</button></div>
    <small className="run-note">Past 2 hours of rain radar. Drag to move, zoom with + and −. Radar © RainViewer · Map © Esri, HERE, Garmin. Radar shows what has fallen, not a forecast.</small>
  </section>;
}
