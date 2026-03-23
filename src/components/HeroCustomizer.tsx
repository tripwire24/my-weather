'use client';

import { HERO_WIDGETS, type HeroWidgetId } from '@/hooks/useHeroPreferences';

interface HeroCustomizerProps {
  enabled: Set<HeroWidgetId>;
  onToggle: (id: HeroWidgetId) => void;
  onClose: () => void;
}

export function HeroCustomizer({ enabled, onToggle, onClose }: HeroCustomizerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(5,5,15,0.97)', backdropFilter: 'blur(16px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--sg-border)]">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{ border: '1px solid var(--sg-border)', color: 'var(--sg-cyan)' }}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 6L6 10M6 6l4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
          </svg>
        </button>
        <div>
          <div
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'var(--sg-cyan)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            CUSTOMISE HERO
          </div>
          <div className="sg-label">Choose which stats appear in your dashboard</div>
        </div>
      </div>

      {/* Widget list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <p className="sg-label mb-3 leading-relaxed">
          The core temperature, conditions, and hi/low are always shown.
          Toggle the extra stat tiles below:
        </p>

        {HERO_WIDGETS.map(widget => {
          const on = enabled.has(widget.id);
          return (
            <button
              key={widget.id}
              onClick={() => onToggle(widget.id)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98]"
              style={{
                background: on ? 'rgba(92, 224, 214,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${on ? 'rgba(92, 224, 214,0.35)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: on ? '0 0 12px rgba(92, 224, 214,0.08)' : 'none',
              }}
            >
              {/* Toggle pill */}
              <div
                className="flex-shrink-0 rounded-full transition-all duration-200"
                style={{
                  width: '40px',
                  height: '22px',
                  background: on ? 'var(--sg-cyan)' : 'rgba(255,255,255,0.1)',
                  boxShadow: on ? '0 0 10px rgba(92, 224, 214,0.5)' : 'none',
                  position: 'relative',
                }}
              >
                <div
                  className="absolute top-0.5 rounded-full transition-all duration-200"
                  style={{
                    width: '18px',
                    height: '18px',
                    background: on ? '#0c0c14' : 'rgba(255,255,255,0.4)',
                    left: on ? '20px' : '2px',
                  }}
                />
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold leading-tight"
                  style={{ color: on ? 'var(--sg-cyan)' : 'var(--sg-text-secondary)' }}
                >
                  {widget.label}
                </div>
                <div className="sg-label mt-0.5">{widget.description}</div>
              </div>

              {/* Preview chip */}
              <WidgetPreview id={widget.id} on={on} />
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--sg-border)]">
        <div className="sg-label text-center">
          {enabled.size} widget{enabled.size !== 1 ? 's' : ''} enabled · Changes save automatically
        </div>
      </div>
    </div>
  );
}

// Small preview chip showing what the widget looks like
function WidgetPreview({ id, on }: { id: HeroWidgetId; on: boolean }) {
  const color = on ? 'var(--sg-cyan)' : 'var(--sg-text-muted)';
  const preview: Record<string, string> = {
    wind:           '12 km/h NW',
    humidity:       '72%',
    uv:             'UV 6',
    pressure:       '1013 hPa',
    dewpoint:       '12°C',
    visibility:     '15 km',
    precip_prob:    '30%',
    cloud_cover:    '45%',
    sunrise_sunset: '6:12 am',
  };
  return (
    <div
      className="flex-shrink-0 px-2 py-1 rounded text-[10px] sg-mono"
      style={{
        background: on ? 'rgba(92, 224, 214,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${on ? 'rgba(92, 224, 214,0.2)' : 'rgba(255,255,255,0.06)'}`,
        color,
      }}
    >
      {preview[id] ?? '—'}
    </div>
  );
}

// Re-export type for use in other files
export type { HeroWidgetId };
