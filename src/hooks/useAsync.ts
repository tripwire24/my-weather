'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const cache = new Map<string, { t: number; data: unknown }>();

export function useAsync<T>(fn: () => Promise<T>, key: string | null, ttl = 10 * 60 * 1000) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: false, error: null });
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  const run = useCallback((force: boolean) => {
    if (!key) return () => {};
    let alive = true;
    const hit = cache.get(key);
    if (!force && hit && Date.now() - hit.t < ttl) {
      queueMicrotask(() => alive && setState({ data: hit.data as T, loading: false, error: null }));
      return () => { alive = false; };
    }
    queueMicrotask(() => alive && setState(s => ({ ...s, data: hit ? (hit.data as T) : s.data, loading: true, error: null })));
    fnRef.current().then(
      data => { cache.set(key, { t: Date.now(), data }); if (alive) setState({ data, loading: false, error: null }); },
      e => { if (alive) setState(s => ({ ...s, loading: false, error: e instanceof Error ? e.message : String(e) })); },
    );
    return () => { alive = false; };
  }, [key, ttl]);
  useEffect(() => run(false), [run]);
  const refresh = useCallback(() => { run(true); }, [run]);
  return { ...state, refresh };
}
