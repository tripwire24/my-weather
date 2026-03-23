'use client';

interface ArcGaugeProps {
  value: number;       // 0-100
  size?: number;       // px diameter
  color?: string;
  trackColor?: string;
  strokeWidth?: number;
  label?: string;
  unit?: string;
  showValue?: boolean;
  startAngle?: number; // degrees, default -210
  endAngle?: number;   // degrees, default 30
}

export function ArcGauge({
  value,
  size = 80,
  color = '#5ce0d6',
  trackColor = 'rgba(92, 224, 214,0.1)',
  strokeWidth = 6,
  label,
  unit = '',
  showValue = true,
  startAngle = -210,
  endAngle = 30,
}: ArcGaugeProps) {
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const totalAngle = endAngle - startAngle; // typically 240°
  const clampedValue = Math.min(100, Math.max(0, value));
  const filledAngle = (clampedValue / 100) * totalAngle;

  function polarToCart(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function describeArc(start: number, end: number, radius: number) {
    const s = polarToCart(start, radius);
    const e = polarToCart(end, radius);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const trackPath = describeArc(startAngle, endAngle, r);
  const fillPath = filledAngle > 0
    ? describeArc(startAngle, startAngle + filledAngle, r)
    : '';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        )}
        {/* Value text */}
        {showValue && (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fontSize={size * 0.22}
            fontFamily="'JetBrains Mono', monospace"
            fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          >
            {Math.round(clampedValue)}{unit}
          </text>
        )}
      </svg>
      {label && (
        <span className="sg-label text-center leading-tight">{label}</span>
      )}
    </div>
  );
}
