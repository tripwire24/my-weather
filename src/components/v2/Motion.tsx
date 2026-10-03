'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CountUp({ value }: { value: number }) {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current; prev.current = value;
    if (from === value || reduced()) { queueMicrotask(() => setV(value)); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(from + (value - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{v}</>;
}

// Pointer / touch-drag / (Android) device-tilt parallax. Writes CSS variables only, so React never re-renders.
export function useTilt(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active || reduced()) return;
    let raf = 0, nx = 0, ny = 0, dragging = false;
    const apply = () => {
      raf = 0;
      el.style.setProperty('--ry', `${(nx * 7).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-ny * 5).toFixed(2)}deg`);
      el.style.setProperty('--tx', nx.toFixed(3));
      el.style.setProperty('--ty', ny.toFixed(3));
      el.style.setProperty('--gx', `${(50 + nx * 45).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(30 + ny * 45).toFixed(1)}%`);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      queue();
    };
    const down = () => { dragging = true; el.classList.add('tilting'); };
    const leave = () => { dragging = false; el.classList.remove('tilting'); nx = 0; ny = 0; queue(); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointerup', leave);
    el.addEventListener('pointercancel', leave);
    let base: { b: number; g: number } | null = null;
    const orient = (e: DeviceOrientationEvent) => {
      if (dragging || e.beta == null || e.gamma == null) return;
      if (!base) base = { b: e.beta, g: e.gamma };
      nx = Math.max(-1, Math.min(1, (e.gamma - base.g) / 25));
      ny = Math.max(-1, Math.min(1, (e.beta - base.b) / 25));
      queue();
    };
    // iOS gates motion data behind a permission prompt; only listen where it is not required.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const needsPerm = typeof (window as any).DeviceOrientationEvent?.requestPermission === 'function';
    if (!needsPerm && 'DeviceOrientationEvent' in window) window.addEventListener('deviceorientation', orient);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave); el.removeEventListener('pointerup', leave); el.removeEventListener('pointercancel', leave);
      window.removeEventListener('deviceorientation', orient);
    };
  }, [ref, active]);
}

const RAIN = (c: number) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;
const SNOW = (c: number) => (c >= 71 && c <= 77) || c === 85 || c === 86;

export function Ambient({ code, isDay }: { code?: number; isDay?: boolean }) {
  const c = code ?? 3;
  const rain = RAIN(c), snow = SNOW(c), clear = c <= 1;
  const drops = Array.from({ length: rain || snow ? 26 : 0 }, (_, i) => {
    const depth = (i * 37) % 3; // 0 far, 1 mid, 2 near
    return { left: (i * 53) % 100, delay: -((i * 29) % 17) / 10, dur: (snow ? 7 : 1.1) + (2 - depth) * (snow ? 2 : 0.45), depth };
  });
  const stars = Array.from({ length: isDay === false && !rain ? 28 : 0 }, (_, i) => ({ left: (i * 47) % 100, top: (i * 31) % 70, delay: (i % 7) * 0.6, size: 1 + (i % 3) }));
  return <div className={`ambient ${isDay === false ? 'night' : 'day'} ${rain ? 'is-rain' : ''} ${clear ? 'is-clear' : ''}`} aria-hidden="true">
    <i className="blob b1" /><i className="blob b2" /><i className="blob b3" />
    {clear && isDay !== false && <i className="sun-flare" />}
    {stars.map((s, i) => <i key={`s${i}`} className="star" style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s`, width: s.size, height: s.size }} />)}
    {drops.map((d, i) => <i key={`d${i}`} className={`${snow ? 'flake' : 'drop'} d${d.depth}`} style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }} />)}
  </div>;
}

// A lit sphere. `phase` runs 0..1 (0 new, 0.5 full).
export function MoonSphere({ phase }: { phase: number }) {
  const waxing = phase <= 0.5;
  const x = waxing ? -phase * 2 * 100 : (1 - (phase - 0.5) * 2) * 100;
  return <div className="moon-sphere" role="img" aria-label="Moon phase"><div className="moon-lit" /><div className="moon-dark" style={{ transform: `translateX(${x}%)` }} /></div>;
}

export function Ticker({ items }: { items: string[] }) {
  const row = items.map((t, i) => <span key={i}>{t}<b aria-hidden="true">✺</b></span>);
  return <div className="ticker" aria-label={items.join(', ')}><div className="ticker-track" aria-hidden="true"><div>{row}</div><div>{row}</div></div></div>;
}

export function Wave() {
  return <svg className="hero-wave" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 Q 100 0 200 30 T 400 30 T 600 30 T 800 30 T 1000 30 T 1200 30 V60 H0Z" /></svg>;
}
