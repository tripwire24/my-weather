'use client';

import { formatTime } from '@/lib/formatters';

interface SunArcProps {
  sunrise: string;
  sunset: string;
  position: number; // 0-1
  width?: number;
  height?: number;
}

export function SunArc({ sunrise, sunset, position, width = 280, height = 100 }: SunArcProps) {
  const pad = 20;
  const arcCx = width / 2;
  const arcCy = height + 10; // center below the SVG so we get a nice half-arc
  const arcR = height * 1.05;

  // Arc from -165° to -15° (left to right, above center)
  const startAngle = -165 * (Math.PI / 180);
  const endAngle = -15 * (Math.PI / 180);
  const totalAngle = endAngle - startAngle;

  function angleToXY(angle: number) {
    return {
      x: arcCx + arcR * Math.cos(angle),
      y: arcCy + arcR * Math.sin(angle),
    };
  }

  const arcStart = angleToXY(startAngle);
  const arcEnd = angleToXY(endAngle);

  const arcPath = `M ${arcStart.x.toFixed(1)} ${arcStart.y.toFixed(1)} A ${arcR} ${arcR} 0 0 1 ${arcEnd.x.toFixed(1)} ${arcEnd.y.toFixed(1)}`;

  // Sun position along arc
  const sunAngle = startAngle + totalAngle * Math.max(0, Math.min(1, position));
  const sunPos = angleToXY(sunAngle);

  // Below-horizon check
  const isAboveHorizon = position > 0 && position < 1;

  // Horizon line
  const horizonY = arcCy; // this is below our SVG area; horizon should be at the base of the arc
  // Actually let's find where y is at max (bottom of arc, which is horizon)
  // The arc baseline endpoints
  const baselineY = Math.max(arcStart.y, arcEnd.y);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="hidden">
      {/* Horizon line */}
      <line
        x1={arcStart.x - 4} y1={baselineY}
        x2={arcEnd.x + 4} y2={baselineY}
        stroke="rgba(0,255,242,0.2)" strokeWidth={1} strokeDasharray="4 4"
      />

      {/* Track arc (unfilled) */}
      <path
        d={arcPath}
        fill="none"
        stroke="rgba(0,255,242,0.15)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* Filled arc up to sun position */}
      {isAboveHorizon && position > 0 && (
        <path
          d={`M ${arcStart.x.toFixed(1)} ${arcStart.y.toFixed(1)} A ${arcR} ${arcR} 0 0 1 ${sunPos.x.toFixed(1)} ${sunPos.y.toFixed(1)}`}
          fill="none"
          stroke="#ffb800"
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 0 4px #ffb800)' }}
        />
      )}

      {/* Sun indicator */}
      {isAboveHorizon && (
        <g>
          <circle cx={sunPos.x} cy={sunPos.y} r={7} fill="#ffb800" opacity={0.2} />
          <circle cx={sunPos.x} cy={sunPos.y} r={4} fill="#ffb800"
            style={{ filter: 'drop-shadow(0 0 8px #ffb800)' }}
          />
        </g>
      )}

      {/* Sunrise label */}
      <text
        x={arcStart.x}
        y={baselineY + 14}
        textAnchor="middle"
        fontSize={9}
        fontFamily="'JetBrains Mono', monospace"
        fill="rgba(0,255,242,0.5)"
      >
        {formatTime(sunrise)}
      </text>

      {/* Sunset label */}
      <text
        x={arcEnd.x}
        y={baselineY + 14}
        textAnchor="middle"
        fontSize={9}
        fontFamily="'JetBrains Mono', monospace"
        fill="rgba(0,255,242,0.5)"
      >
        {formatTime(sunset)}
      </text>
    </svg>
  );
}
