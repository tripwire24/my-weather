"use client";

interface ArcGaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
}

/**
 * Radial arc gauge with neon glow.
 */
export function ArcGauge({
  value,
  max,
  label,
  unit = "",
  color = "#00fff2",
  size = 100,
}: ArcGaugeProps) {
  const percentage = Math.min(value / max, 1);
  const radius = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135;
  const totalAngle = 270;
  const endAngle = startAngle + totalAngle * percentage;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcStart = {
    x: cx + radius * Math.cos(toRad(startAngle)),
    y: cy + radius * Math.sin(toRad(startAngle)),
  };
  const arcEnd = {
    x: cx + radius * Math.cos(toRad(endAngle)),
    y: cy + radius * Math.sin(toRad(endAngle)),
  };
  const bgEnd = {
    x: cx + radius * Math.cos(toRad(startAngle + totalAngle)),
    y: cy + radius * Math.sin(toRad(startAngle + totalAngle)),
  };
  const largeArc = totalAngle * percentage > 180 ? 1 : 0;

  const bgPath = `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;
  const valuePath = percentage > 0
    ? `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`
    : "";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {valuePath && (
          <path
            d={valuePath}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${color})`,
            }}
          />
        )}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size * 0.22}
          fontFamily="var(--font-mono)"
        >
          {Math.round(value)}
          {unit}
        </text>
        <text
          x={cx}
          y={cy + size * 0.16}
          textAnchor="middle"
          fill="#8888aa"
          fontSize={size * 0.11}
          fontFamily="var(--font-sans)"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
