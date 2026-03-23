'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  showDots?: boolean;
  highlightIndex?: number; // highlight a specific point
}

export function Sparkline({
  data,
  width = 200,
  height = 40,
  color = '#5ce0d6',
  fillColor,
  strokeWidth = 1.5,
  showDots = false,
  highlightIndex,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + ((1 - (v - min) / range) * (height - pad * 2)),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const fillD = fillColor
    ? `${pathD} L ${points[points.length - 1].x} ${height - pad} L ${points[0].x} ${height - pad} Z`
    : null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible">
      {/* Fill area */}
      {fillD && (
        <path
          d={fillD}
          fill={fillColor}
          opacity={0.15}
        />
      )}
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      {/* Dots */}
      {showDots && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === highlightIndex ? 3 : 1.5}
          fill={i === highlightIndex ? '#fff' : color}
          style={i === highlightIndex ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined}
        />
      ))}
    </svg>
  );
}
