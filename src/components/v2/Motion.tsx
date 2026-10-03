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
    <i className="tron-floor" /><i className="tron-horizon" /><i className="lbar l1" /><i className="lbar l2" /><i className="lbar l3" /><i className="bokeh" /><i className="blob b1" /><i className="blob b2" /><i className="blob b3" />
    {Array.from({ length: 14 }, (_, i) => <i key={`m${i}`} className="mote" style={{ left: `${(i * 41 + 7) % 100}%`, animationDelay: `${-((i * 13) % 20)}s`, animationDuration: `${16 + (i % 5) * 4}s`, width: 2 + (i % 3), height: 2 + (i % 3) }} />)}
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

// Touch FX: liquid ripple + amber sparkle burst where you touch, a light that follows your finger across a panel,
// and scroll reveals. Event delegation, transform/opacity only, nothing blocks scrolling.
export function useLivingUI() {
  useEffect(() => {
    if (reduced()) return;
    const layer = document.createElement('div');
    layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    const spawn = (x: number, y: number, big: boolean) => {
      const r = document.createElement('i'); r.className = big ? 'fx-liquid' : 'fx-ripple';
      r.style.left = `${x}px`; r.style.top = `${y}px`; layer.appendChild(r);
      setTimeout(() => r.remove(), big ? 900 : 700);
      const n = big ? 10 : 7;
      for (let i = 0; i < n; i++) {
        const sp = document.createElement('i'); sp.className = 'fx-spark';
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.6, d = (big ? 70 : 44) + Math.random() * 30;
        sp.style.left = `${x}px`; sp.style.top = `${y}px`;
        sp.style.setProperty('--dx', `${Math.cos(a) * d}px`); sp.style.setProperty('--dy', `${Math.sin(a) * d}px`);
        sp.style.animationDelay = `${Math.random() * 60}ms`;
        layer.appendChild(sp); setTimeout(() => sp.remove(), 800);
      }
      while (layer.childElementCount > 40) layer.firstElementChild?.remove();
    };
    let lit: HTMLElement | null = null, raf = 0, px = 0, py = 0;
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null; if (!t || !t.closest) return;
      const nav = t.closest('.day-nav button');
      if (nav || t.closest('button, .v2-card, .planner-card, .now-metrics > div')) spawn(e.clientX, e.clientY, !!nav);
      const card = t.closest('.v2-card, .planner-card, .now-metrics > div') as HTMLElement | null;
      if (card) { lit = card; card.classList.add('lit'); move(e); }
    };
    const move = (e: PointerEvent) => {
      if (!lit) return; px = e.clientX; py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; if (!lit) return; const r = lit.getBoundingClientRect(); lit.style.setProperty('--mx', `${px - r.left}px`); lit.style.setProperty('--my', `${py - r.top}px`); });
    };
    const up = () => { if (lit) { lit.classList.remove('lit'); lit = null; } };
    document.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerup', up, { passive: true });
    document.addEventListener('pointercancel', up, { passive: true });

    // Reveals: panels below the fold start dimmed and slid, then rise into place as they scroll in.
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { (en.target as HTMLElement).classList.add('rv-in'); io.unobserve(en.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    const scan = () => {
      document.querySelectorAll<HTMLElement>('.day-main .v2-card, .day-main .planner-card, .day-main .stat-card').forEach((el) => {
        if (el.dataset.rv) return; el.dataset.rv = '1';
        if (el.getBoundingClientRect().top > innerHeight * 0.9) { el.classList.add('rv-pre'); io.observe(el); }
      });
    };
    let sraf = 0; const mo = new MutationObserver(() => { scan(); if (!sraf) sraf = requestAnimationFrame(() => { sraf = 0; fx(); }); });
    const main = document.querySelector('.day-app'); if (main) mo.observe(main, { childList: true, subtree: true });
    const fx = () => {
      document.querySelectorAll<HTMLElement>('.detail-grid *, .day-main .space-y-2 *').forEach((el) => {
        if (el.dataset.cu) return;
        if (el.childElementCount === 0 && el.tagName !== 'path' && el.tagName !== 'circle') {
          const m = /^(-?\d+(?:\.\d+)?)(.{0,8})$/.exec((el.textContent || '').trim());
          if (m && !el.closest('svg') && el.childNodes.length === 1 && el.firstChild?.nodeType === 3) {
            el.dataset.cu = '1'; const end = parseFloat(m[1]), dec = (m[1].split('.')[1] || '').length, suf = m[2], node = el.firstChild as Text, orig = node.nodeValue || '';
            const t0 = performance.now(); const tick = (t: number) => { const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); node.nodeValue = k < 1 ? `${(end * e).toFixed(dec)}${suf}` : orig; if (k < 1) requestAnimationFrame(tick); };
            requestAnimationFrame(tick);
          }
        }
        if (el.tagName === 'path' || el.tagName === 'polyline') {
          const sv = el as unknown as SVGElement;
          if (sv.getAttribute('fill') === 'none' && sv.getAttribute('stroke') && !sv.getAttribute('stroke-dasharray') && el.closest('svg')) {
            el.dataset.cu = '1'; sv.setAttribute('pathLength', '1'); sv.classList.add('draw');
          }
        }
      });
    };
    scan(); fx();
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); mo.disconnect(); io.disconnect(); layer.remove(); };
  }, []);
}
