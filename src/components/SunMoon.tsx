'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import { SunArc } from '@/components/ui/SunArc';
import { MoonPhaseIcon } from '@/components/ui/MoonPhaseIcon';
import { formatTime, formatDuration, formatDate, formatCountdown } from '@/lib/formatters';
import type { SunInfo, MoonPhaseInfo } from '@/types/weather';

interface SunMoonProps {
  sun: SunInfo;
  moon: MoonPhaseInfo;
}

export function SunMoon({ sun, moon }: SunMoonProps) {
  const summary = `↑ ${formatTime(sun.sunrise)} · ↓ ${formatTime(sun.sunset)} · ${moon.phaseName}`;

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth={1.3} />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );

  return (
    <CollapsibleCard
      title="Sun & Moon"
      summary={summary}
      accentColor="amber"
      icon={icon}
    >
      {/* Sun arc */}
      <div className="mb-4">
        <div className="flex justify-center">
          <SunArc
            sunrise={sun.sunrise}
            sunset={sun.sunset}
            position={sun.currentPosition}
            goldenHourMorningEnd={sun.goldenHourMorningEnd}
            goldenHourEveningStart={sun.goldenHourEveningStart}
            solarNoon={sun.solarNoon}
            width={300}
            height={120}
          />
        </div>
      </div>

      {/* Sun times grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SunTimeCard label="SUNRISE" time={sun.sunrise} color="#e8a830" icon="↑" />
        <SunTimeCard label="SUNSET" time={sun.sunset} color="#ff6600" icon="↓" />
        <SunTimeCard label="SOLAR NOON" time={sun.solarNoon} color="#ffff00" icon="◉" />
        <SunTimeCard label="DAY LENGTH" time={null} value={formatDuration(sun.dayLength)} color="var(--sg-cyan)" icon="⏱" />
      </div>

      {/* Golden / Blue hour */}
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(232, 168, 48,0.05)', border: '1px solid rgba(232, 168, 48,0.15)' }}>
        <span className="sg-label block mb-2">GOLDEN & BLUE HOUR</span>
        <div className="grid grid-cols-2 gap-2">
          <MiniTime label="Blue hour AM" time={sun.blueHourMorningStart} color="#6b8cff" />
          <MiniTime label="Golden AM ends" time={sun.goldenHourMorningEnd} color="#e8a830" />
          <MiniTime label="Golden PM starts" time={sun.goldenHourEveningStart} color="#ff6600" />
          <MiniTime label="Blue hour PM" time={sun.blueHourEveningEnd} color="#6b8cff" />
        </div>
      </div>

      <div className="sg-hr mb-4" />

      {/* Moon */}
      <div className="flex items-center gap-4 mb-4">
        <MoonPhaseIcon phase={moon.phase} size={72} color="#5ce0d6" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-[var(--sg-text-primary)] mb-1">{moon.phaseName}</div>
          <div className="sg-label mb-1">ILLUMINATION</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(92, 224, 214,0.1)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${moon.illumination}%`,
                  background: 'var(--sg-cyan)',
                  boxShadow: '0 0 6px var(--sg-cyan)',
                }}
              />
            </div>
            <span className="sg-mono text-xs text-[var(--sg-cyan)]">{moon.illumination}%</span>
          </div>
        </div>
      </div>

      {/* Next full / new moon */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(92, 224, 214,0.05)', border: '1px solid rgba(92, 224, 214,0.12)' }}>
          <span className="sg-label block">NEXT FULL MOON</span>
          <span className="sg-mono text-xs text-[var(--sg-text-primary)] block mt-0.5">
            {formatDate(moon.nextFullMoon)}
          </span>
          <span className="sg-label">{formatCountdown(moon.nextFullMoon)}</span>
        </div>
        <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(92, 224, 214,0.05)', border: '1px solid rgba(92, 224, 214,0.12)' }}>
          <span className="sg-label block">NEXT NEW MOON</span>
          <span className="sg-mono text-xs text-[var(--sg-text-primary)] block mt-0.5">
            {formatDate(moon.nextNewMoon)}
          </span>
          <span className="sg-label">{formatCountdown(moon.nextNewMoon)}</span>
        </div>
      </div>
    </CollapsibleCard>
  );
}

function SunTimeCard({ label, time, value, color, icon }: {
  label: string;
  time: string | null;
  value?: string;
  color: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(232, 168, 48,0.05)', border: '1px solid rgba(232, 168, 48,0.1)' }}>
      <span style={{ color, fontSize: '1rem' }}>{icon}</span>
      <div>
        <span className="sg-label block">{label}</span>
        <span className="sg-mono text-sm" style={{ color }}>
          {value ?? (time ? formatTime(time) : '—')}
        </span>
      </div>
    </div>
  );
}

function MiniTime({ label, time, color }: { label: string; time: string; color: string }) {
  return (
    <div>
      <span className="sg-label block">{label}</span>
      <span className="sg-mono text-xs" style={{ color }}>{formatTime(time)}</span>
    </div>
  );
}
