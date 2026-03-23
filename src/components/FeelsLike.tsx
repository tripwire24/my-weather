'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import { formatTemp } from '@/lib/formatters';
import type { CurrentWeather } from '@/types/weather';

interface FeelsLikeProps {
  current: CurrentWeather;
}

export function FeelsLike({ current }: FeelsLikeProps) {
  const diff = current.feelsLike - current.temperature;
  const isWindChill = diff < -1;
  const isHeatIndex = diff > 1;

  // Wind chill (simplified: relevant below ~10°C with wind)
  const windChillFactor = current.temperature < 10 && current.windSpeed > 5
    ? current.temperature - (current.windSpeed * 0.1)
    : null;

  // Heat index (simplified: relevant above ~25°C with humidity)
  const heatIndexFactor = current.temperature > 25 && current.humidity > 40
    ? current.temperature + ((current.humidity - 40) * 0.07)
    : null;

  // Comfort level
  const comfortLevel = getComfortLevel(current.feelsLike, current.humidity);

  const summary = `${formatTemp(current.feelsLike)} apparent · ${comfortLevel.label}`;

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9 3 V9 A3 3 0 1 1 7 9 V3 H9Z" stroke="currentColor" strokeWidth={1.3} fill="none" strokeLinejoin="round" />
      <line x1="9" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
      <line x1="9" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );

  return (
    <CollapsibleCard
      title="Feels Like Deep Dive"
      summary={summary}
      accentColor="cyan"
      icon={icon}
    >
      {/* Main comparison */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 text-center p-3 rounded-xl" style={{ background: 'rgba(92, 224, 214,0.06)', border: '1px solid rgba(92, 224, 214,0.15)' }}>
          <span className="sg-label block mb-1">ACTUAL</span>
          <span className="sg-mono text-2xl font-bold text-[var(--sg-text-primary)]">{formatTemp(current.temperature)}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <ArrowIcon />
          <span className="sg-mono text-xs" style={{ color: diff < 0 ? 'var(--sg-blue)' : diff > 0 ? 'var(--sg-red)' : 'var(--sg-text-muted)' }}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}°
          </span>
        </div>

        <div className="flex-1 text-center p-3 rounded-xl"
          style={{
            background: `${comfortLevel.color}15`,
            border: `1px solid ${comfortLevel.color}40`,
          }}
        >
          <span className="sg-label block mb-1">FEELS LIKE</span>
          <span className="sg-mono text-2xl font-bold" style={{ color: comfortLevel.color, textShadow: `0 0 12px ${comfortLevel.color}` }}>
            {formatTemp(current.feelsLike)}
          </span>
        </div>
      </div>

      {/* Comfort indicator */}
      <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-lg"
        style={{ background: `${comfortLevel.color}10`, border: `1px solid ${comfortLevel.color}30` }}
      >
        <span className="text-2xl">{comfortLevel.emoji}</span>
        <div>
          <span className="sg-mono text-sm font-semibold" style={{ color: comfortLevel.color }}>
            {comfortLevel.label}
          </span>
          <span className="sg-label block">{comfortLevel.description}</span>
        </div>
      </div>

      {/* Factors */}
      <span className="sg-label block mb-2">CONTRIBUTING FACTORS</span>
      <div className="space-y-2">
        {isWindChill && windChillFactor !== null && (
          <FactorRow
            label="Wind Chill"
            description={`${formatTemp(windChillFactor)} — ${Math.round(current.windSpeed)} km/h wind at ${formatTemp(current.temperature)}`}
            color="var(--sg-blue)"
            icon="💨"
          />
        )}
        {isHeatIndex && heatIndexFactor !== null && (
          <FactorRow
            label="Heat Index"
            description={`${formatTemp(heatIndexFactor)} — ${current.humidity}% humidity amplifies heat`}
            color="var(--sg-red)"
            icon="🌡️"
          />
        )}
        <FactorRow
          label="Humidity"
          description={`${current.humidity}% — ${current.humidity > 70 ? 'makes it feel warmer' : current.humidity < 30 ? 'dry air, slightly cooler' : 'comfortable range'}`}
          color="var(--sg-cyan)"
          icon="💧"
        />
        <FactorRow
          label="Wind"
          description={`${Math.round(current.windSpeed)} km/h — ${current.windSpeed > 30 ? 'significant chill effect' : current.windSpeed > 10 ? 'light chill' : 'minimal effect'}`}
          color="var(--sg-text-secondary)"
          icon="🌬️"
        />
      </div>
    </CollapsibleCard>
  );
}

function getComfortLevel(feelsLike: number, humidity: number): { label: string; color: string; emoji: string; description: string } {
  if (feelsLike < -10) return { label: 'Dangerously Cold', color: '#6b8cff', emoji: '🥶', description: 'Risk of frostbite. Limit outdoor exposure.' };
  if (feelsLike < 0) return { label: 'Very Cold', color: '#7ab2ff', emoji: '❄️', description: 'Heavy winter clothing essential.' };
  if (feelsLike < 8) return { label: 'Cold', color: '#6b8cff', emoji: '🧥', description: 'Warm layers recommended.' };
  if (feelsLike < 15) return { label: 'Cool', color: '#5ce0d6', emoji: '🙂', description: 'Light jacket advised.' };
  if (feelsLike < 22) return { label: 'Comfortable', color: '#4cd89d', emoji: '😊', description: 'Ideal conditions for most.' };
  if (feelsLike < 28) return { label: 'Warm', color: '#ffff00', emoji: '☀️', description: 'Pleasant. Light clothing.' };
  if (feelsLike < 34) return { label: 'Hot', color: '#ff9900', emoji: '🌡️', description: 'Stay hydrated, seek shade.' };
  return { label: 'Very Hot', color: '#e85c78', emoji: '🔥', description: 'Heat stress risk. Minimize exertion.' };
}

function FactorRow({ label, description, color, icon }: { label: string; description: string; color: string; icon: string }) {
  return (
    <div className="flex items-start gap-2.5 p-2 rounded-lg" style={{ background: 'rgba(92, 224, 214,0.03)', border: '1px solid rgba(92, 224, 214,0.08)' }}>
      <span className="text-base flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="sg-mono text-xs font-semibold" style={{ color }}>{label}</span>
        <span className="sg-label block leading-tight mt-0.5">{description}</span>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 10h10M13 7l3 3-3 3" stroke="rgba(92, 224, 214,0.4)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
