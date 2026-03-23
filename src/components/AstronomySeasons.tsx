'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import { formatDate, formatCountdown, formatDuration } from '@/lib/formatters';
import type { AstronomyInfo } from '@/types/weather';

interface AstronomySeasonsProps {
  astronomy: AstronomyInfo;
  dayLength: number; // minutes
}

const SEASON_COLORS: Record<string, string> = {
  Spring: '#00ff88',
  Summer: '#ffb800',
  Autumn: '#ff6600',
  Winter: '#4d7cff',
};

const SEASON_ICONS: Record<string, string> = {
  Spring: '🌱',
  Summer: '☀️',
  Autumn: '🍂',
  Winter: '❄️',
};

export function AstronomySeasons({ astronomy, dayLength }: AstronomySeasonsProps) {
  const { currentSeason, daysRemainingInSeason, nextSolstice, nextEquinox, dayLengthTrend, dayLengthChangeTodayMinutes } = astronomy;
  const seasonColor = SEASON_COLORS[currentSeason] ?? 'var(--sg-cyan)';

  const summary = `${currentSeason} · ${daysRemainingInSeason}d remaining · Day ${dayLengthTrend}`;

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth={1.3} />
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
      <circle cx="8" cy="8" r="2" fill="currentColor" opacity={0.4} />
    </svg>
  );

  return (
    <CollapsibleCard
      title="Astronomy & Seasons"
      summary={summary}
      accentColor="magenta"
      icon={icon}
    >
      {/* Current season */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl"
        style={{
          background: `${seasonColor}10`,
          border: `1px solid ${seasonColor}30`,
        }}
      >
        <div className="text-3xl">{SEASON_ICONS[currentSeason]}</div>
        <div className="flex-1">
          <div className="sg-mono text-base font-bold mb-0.5" style={{ color: seasonColor }}>
            {currentSeason}
          </div>
          <div className="sg-label">{daysRemainingInSeason} days remaining</div>
          {/* Season progress bar */}
          <div className="mt-1.5 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            {/* Approx 92 days per season */}
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(5, Math.min(95, ((92 - daysRemainingInSeason) / 92) * 100))}%`,
                background: seasonColor,
                boxShadow: `0 0 6px ${seasonColor}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Day length */}
      <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(255,0,255,0.05)', border: '1px solid rgba(255,0,255,0.15)' }}
      >
        <div>
          <span className="sg-label block">DAY LENGTH</span>
          <span className="sg-mono text-sm text-[var(--sg-text-primary)]">{formatDuration(dayLength)}</span>
        </div>
        <div className="text-right">
          <span className="sg-label block">TREND</span>
          <span className="sg-mono text-sm" style={{ color: dayLengthTrend === 'increasing' ? 'var(--sg-green)' : 'var(--sg-red)' }}>
            {dayLengthTrend === 'increasing' ? '+' : '−'}{dayLengthChangeTodayMinutes.toFixed(1)}min/day
          </span>
        </div>
      </div>

      {/* Upcoming events */}
      <span className="sg-label block mb-2">UPCOMING EVENTS</span>
      <div className="space-y-2">
        <EventCard
          label={nextSolstice.type === 'summer' ? 'Summer Solstice' : 'Winter Solstice'}
          date={nextSolstice.date}
          type="solstice"
          color={nextSolstice.type === 'summer' ? '#ffb800' : '#4d7cff'}
        />
        <EventCard
          label={nextEquinox.type === 'spring' ? 'Spring Equinox' : 'Autumn Equinox'}
          date={nextEquinox.date}
          type="equinox"
          color={nextEquinox.type === 'spring' ? '#00ff88' : '#ff6600'}
        />
      </div>
    </CollapsibleCard>
  );
}

function EventCard({ label, date, type, color }: {
  label: string;
  date: string;
  type: 'solstice' | 'equinox';
  color: string;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg"
      style={{ background: `${color}08`, border: `1px solid ${color}25` }}
    >
      <div className="flex items-center gap-2">
        <div className="text-lg">{type === 'solstice' ? '🌞' : '⚖️'}</div>
        <div>
          <div className="sg-mono text-xs font-semibold" style={{ color }}>{label}</div>
          <div className="sg-label">{formatDate(date)}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="sg-mono text-xs" style={{ color }}>{formatCountdown(date)}</div>
      </div>
    </div>
  );
}
