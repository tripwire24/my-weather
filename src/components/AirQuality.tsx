'use client';

import { CollapsibleCard } from '@/components/CollapsibleCard';
import { ArcGauge } from '@/components/ui/ArcGauge';
import { aqiCategory } from '@/lib/formatters';
import type { AirQuality as AirQualityType } from '@/types/weather';

interface AirQualityProps {
  airQuality: AirQualityType;
}

export function AirQuality({ airQuality }: AirQualityProps) {
  const { aqi, pm25, pm10, no2, o3, so2, dominantPollutant, category } = airQuality;
  const cat = aqiCategory(aqi);

  const summary = `AQI ${Math.round(aqi)} — ${category} · ${dominantPollutant} dominant`;

  const icon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3 C5 5 2 6 2 9 a6 6 0 0 0 12 0 C14 6 11 5 8 3Z" stroke="currentColor" strokeWidth={1.3} fill="none" />
      <path d="M8 7v4M6 9h4" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );

  return (
    <CollapsibleCard
      title="Air Quality"
      summary={summary}
      accentColor="magenta"
      icon={icon}
    >
      {/* AQI main */}
      <div className="flex items-center gap-4 mb-4">
        <ArcGauge
          value={Math.min(100, aqi)}
          size={90}
          color={cat.color}
          label="AQI"
          unit=""
          showValue={true}
        />
        <div className="flex-1">
          <div className="sg-mono text-2xl font-bold mb-0.5" style={{ color: cat.color, textShadow: `0 0 12px ${cat.color}` }}>
            {category}
          </div>
          <div className="sg-label mb-1">DOMINANT POLLUTANT</div>
          <div className="sg-mono text-sm text-[var(--sg-text-primary)]">{dominantPollutant}</div>
        </div>
      </div>

      {/* AQI scale */}
      <div className="mb-4">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, aqi)}%`,
              background: `linear-gradient(90deg, #4cd89d, #5ce0d6, #ffff00, #ff9900, #e85c78, #c874e8)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          {['Good', 'Fair', 'Mod', 'Poor', 'V.Poor'].map(l => (
            <span key={l} className="sg-label text-[9px]">{l}</span>
          ))}
        </div>
      </div>

      {/* Pollutant breakdown */}
      <span className="sg-label block mb-2">POLLUTANT LEVELS</span>
      <div className="grid grid-cols-2 gap-2">
        <PollutantBar label="PM2.5" value={pm25} max={75} unit="μg/m³" />
        <PollutantBar label="PM10" value={pm10} max={150} unit="μg/m³" />
        <PollutantBar label="NO₂" value={no2} max={200} unit="μg/m³" />
        <PollutantBar label="O₃" value={o3} max={180} unit="μg/m³" />
        <PollutantBar label="SO₂" value={so2} max={350} unit="μg/m³" />
      </div>
    </CollapsibleCard>
  );
}

function PollutantBar({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct < 30 ? 'var(--sg-green)' : pct < 60 ? 'var(--sg-cyan)' : pct < 80 ? 'var(--sg-amber)' : 'var(--sg-red)';

  return (
    <div className="p-2 rounded-lg" style={{ background: 'rgba(200, 116, 232,0.04)', border: '1px solid rgba(200, 116, 232,0.12)' }}>
      <div className="flex justify-between mb-1">
        <span className="sg-label">{label}</span>
        <span className="sg-mono text-[10px]" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: pct > 50 ? `0 0 4px ${color}` : 'none' }} />
      </div>
      <span className="sg-label">{unit}</span>
    </div>
  );
}
