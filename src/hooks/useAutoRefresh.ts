'use client';

import { useEffect, useRef } from 'react';
import { AUTO_REFRESH_INTERVAL_MS } from '@/lib/constants';

export function useAutoRefresh(refresh: () => void, enabled = true) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      // Only refresh if page is visible
      if (!document.hidden) {
        refreshRef.current();
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    // Refresh when tab becomes visible after being hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);
}
