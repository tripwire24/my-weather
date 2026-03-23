'use client';

import { windDegToDirection } from '@/lib/formatters';

interface CompassRoseProps {
  degrees: number;
  size?: number;
  color?: string;
}

export function CompassRose({ degrees, size = 80, color = '#5ce0d6' }: CompassRoseProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const arrowLen = r * 0.7;
  const trackR = r * 0.9;

  const rad = ((degrees - 90) * Math.PI) / 180;
  const arrowTip = {
    x: cx + Math.cos(rad) * arrowLen,
    y: cy + Math.sin(rad) * arrowLen,
  };
  const arrowTail = {
    x: cx - Math.cos(rad) * arrowLen * 0.5,
    y: cy - Math.sin(rad) * arrowLen * 0.5,
  };
  const arrowLeft = {
    x: cx + Math.cos(rad + Math.PI * 0.55) * arrowLen * 0.28,
    y: cy + Math.sin(rad + Math.PI * 0.55) * arrowLen * 0.28,
  };
  const arrowRight = {
    x: cx + Math.cos(rad - Math.PI * 0.55) * arrowLen * 0.28,
    y: cy + Math.sin(rad - Math.PI * 0.55) * arrowLen * 0.28,
  };

  const cardinals = ['N', 'E', 'S', 'W'];
  const labelR = r * 1.18;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={trackR} fill="none" stroke={color} strokeWidth={1} opacity={0.2} />

        {/* Tick marks */}
        {Array.from({ length: 16 }).map((_, i) => {
          const a = ((i * 360) / 16 - 90) * (Math.PI / 180);
          const isCardinal = i % 4 === 0;
          const innerR = isCardinal ? trackR * 0.82 : trackR * 0.9;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * innerR}
              y1={cy + Math.sin(a) * innerR}
              x2={cx + Math.cos(a) * trackR}
              y2={cy + Math.sin(a) * trackR}
              stroke={color}
              strokeWidth={isCardinal ? 1.5 : 0.8}
              opacity={isCardinal ? 0.5 : 0.25}
            />
          );
        })}

        {/* Cardinal labels */}
        {cardinals.map((label, i) => {
          const a = (i * 90 - 90) * (Math.PI / 180);
          return (
            <text
              key={label}
              x={cx + Math.cos(a) * labelR}
              y={cy + Math.sin(a) * labelR + 3}
              textAnchor="middle"
              fontSize={size * 0.12}
              fontFamily="'JetBrains Mono', monospace"
              fill={label === 'N' ? '#c874e8' : color}
              opacity={label === 'N' ? 0.9 : 0.5}
              fontWeight={label === 'N' ? 'bold' : 'normal'}
            >
              {label}
            </text>
          );
        })}

        {/* Arrow */}
        <path
          d={`M ${arrowTip.x} ${arrowTip.y} L ${arrowLeft.x} ${arrowLeft.y} L ${arrowTail.x} ${arrowTail.y} L ${arrowRight.x} ${arrowRight.y} Z`}
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={size * 0.04} fill={color} opacity={0.8} />

        {/* Degrees text */}
        <text
          x={cx}
          y={cy + size * 0.47}
          textAnchor="middle"
          fontSize={size * 0.13}
          fontFamily="'JetBrains Mono', monospace"
          fill={color}
          opacity={0.7}
        >
          {Math.round(degrees)}° {windDegToDirection(degrees)}
        </text>
      </svg>
    </div>
  );
}
