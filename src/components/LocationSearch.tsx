"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { LocationInfo, GeocodingResult } from "@/types/weather";
import { geocodeSearch } from "@/lib/openmeteo";

interface LocationSearchProps {
  onSelect: (location: LocationInfo) => void;
  onRequestGeolocation: () => void;
}

export function LocationSearch({
  onSelect,
  onRequestGeolocation,
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await geocodeSearch(q);
      setResults(res);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(value), 300);
    },
    [search]
  );

  const handleSelect = useCallback(
    (result: GeocodingResult) => {
      onSelect({
        name: result.name,
        country: result.country,
        admin1: result.admin1,
        coordinates: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
      });
      setOpen(false);
      setQuery("");
      setResults([]);
    },
    [onSelect]
  );

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-sg-text-muted hover:text-sg-cyan transition-colors px-2 py-1 rounded-lg"
        aria-label="Change location"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Change location
      </button>
    );
  }

  return (
    <div className="sg-card sg-glow-cyan p-3 sg-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search city..."
          className="flex-1 bg-transparent text-sm text-sg-text-primary placeholder:text-sg-text-muted outline-none border-b border-sg-cyan/20 pb-1 "
        />
        <button
          onClick={() => {
            setOpen(false);
            setQuery("");
            setResults([]);
          }}
          className="text-sg-text-muted hover:text-sg-text-primary text-xs"
        >
          Cancel
        </button>
      </div>

      {/* Use current location button */}
      <button
        onClick={() => {
          onRequestGeolocation();
          setOpen(false);
        }}
        className="w-full flex items-center gap-2 px-2 py-2 text-xs text-sg-cyan hover:bg-white/5 rounded-lg transition-colors mb-1"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="7" y1="0" x2="7" y2="3" stroke="currentColor" strokeWidth="1" />
          <line x1="7" y1="11" x2="7" y2="14" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="7" x2="3" y2="7" stroke="currentColor" strokeWidth="1" />
          <line x1="11" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1" />
        </svg>
        Use current location
      </button>

      {/* Results */}
      {searching && (
        <p className="text-xs text-sg-text-muted py-2 text-center">
          Searching...
        </p>
      )}
      {results.length > 0 && (
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-2 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="text-sg-text-primary">{r.name}</span>
              <span className="text-sg-text-muted">
                {r.admin1 ? `, ${r.admin1}` : ""}, {r.country}
              </span>
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="text-xs text-sg-text-muted py-2 text-center">
          No results found
        </p>
      )}
    </div>
  );
}
