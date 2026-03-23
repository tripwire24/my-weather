'use client';

import { useState, useRef, useEffect } from 'react';
import { searchLocations, type GeocodingResult } from '@/lib/openmeteo';
import type { Location } from '@/types/weather';
import { STORAGE_KEYS } from '@/lib/constants';

interface LocationSearchProps {
  onSelect: (location: Location) => void;
  onClose: () => void;
  onRequestGps: () => void;
}

export function LocationSearch({ onSelect, onClose, onRequestGps }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchLocations(query);
        setResults(res);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  const handleSelect = (r: GeocodingResult) => {
    const loc: Location = {
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
      region: r.admin1,
      timezone: r.timezone,
    };
    localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(loc));
    onSelect(loc);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(5,5,15,0.96)', backdropFilter: 'blur(16px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--sg-border)]">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ border: '1px solid var(--sg-border)', color: 'var(--sg-cyan)' }}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 6L6 10M6 6l4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
          </svg>
        </button>

        <div
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ border: '1px solid var(--sg-border-bright)', background: 'rgba(0,255,242,0.05)' }}
        >
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search city or location..."
            className="flex-1 bg-transparent outline-none text-sm text-[var(--sg-text-primary)] placeholder:text-[var(--sg-text-muted)]"
            style={{ fontFamily: 'inherit' }}
          />
          {searching && <SpinnerIcon />}
        </div>
      </div>

      {/* GPS option */}
      <button
        onClick={() => { onRequestGps(); onClose(); }}
        className="flex items-center gap-3 px-4 py-3 border-b border-[var(--sg-border)] active:bg-[var(--sg-cyan-glow)] transition-colors"
      >
        <GpsIcon />
        <div className="text-left">
          <div className="text-sm text-[var(--sg-cyan)]">Use current location</div>
          <div className="sg-label">GPS / Browser geolocation</div>
        </div>
      </button>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 && query && !searching && (
          <div className="px-4 py-8 text-center text-[var(--sg-text-muted)] text-sm">
            No locations found for "{query}"
          </div>
        )}

        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => handleSelect(r)}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-[var(--sg-border)] active:bg-[var(--sg-cyan-glow)] transition-colors text-left"
          >
            <LocationDotIcon />
            <div className="min-w-0">
              <div className="text-sm text-[var(--sg-text-primary)] font-medium truncate">{r.name}</div>
              <div className="sg-label truncate">
                {[r.admin1, r.country].filter(Boolean).join(', ')}
                <span className="ml-2 opacity-50">{r.latitude.toFixed(1)}°, {r.longitude.toFixed(1)}°</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--sg-text-muted)', flexShrink: 0 }}>
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth={1.4} />
      <path d="M9 9l3 3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'sg-rotate 1s linear infinite', color: 'var(--sg-cyan)' }}>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth={1.5} strokeDasharray="20 10" strokeLinecap="round" />
    </svg>
  );
}

function GpsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--sg-cyan)', flexShrink: 0 }}>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth={1.5} />
      <path d="M9 1v3M9 14v3M1 9h3M14 9h3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function LocationDotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--sg-text-muted)', flexShrink: 0 }}>
      <path d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth={1.2} fill="none" />
      <circle cx="7" cy="5" r="1.2" fill="currentColor" />
    </svg>
  );
}
