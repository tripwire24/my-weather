"use client";

interface CompassRoseProps {
  direction: number;
  speed: number;
  size?: number;
}

/**
 * Wind direction compass with animated arrow.
 */
export function CompassRose({ direction, speed, size = 100 }: CompassRoseProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - 20) / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Compass ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(0,255,242,0.15)"
        strokeWidth="1"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.15}
        fill="none"
        stroke="rgba(0,255,242,0.1)"
        strokeWidth="0.5"
      />

      {/* Cardinal markers */}
      {["N", "E", "S", "W"].map((label, i) => {
        const angle = i * 90 - 90;
        const rad = (angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * (radius + 8);
        const y = cy + Math.sin(rad) * (radius + 8);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#8888aa"
            fontSize={size * 0.1}
            fontFamily="var(--font-mono)"
          >
            {label}
          </text>
        );
      })}

      {/* Tick marks */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = i * 22.5 - 90;
        const rad = (angle * Math.PI) / 180;
        const major = i % 4 === 0;
        const inner = radius * (major ? 0.8 : 0.88);
        return (
          <line
            key={i}
            x1={cx + Math.cos(rad) * inner}
            y1={cy + Math.sin(rad) * inner}
            x2={cx + Math.cos(rad) * radius}
            y2={cy + Math.sin(rad) * radius}
            stroke="rgba(0,255,242,0.2)"
            strokeWidth={major ? "1.5" : "0.5"}
          />
        );
      })}

      {/* Wind direction arrow */}
      <g
        transform={`rotate(${direction}, ${cx}, ${cy})`}
        style={{
          transition: "transform 0.5s ease",
          filter: "drop-shadow(0 0 4px #00fff2)",
        }}
      >
        <line
          x1={cx}
          y1={cy + radius * 0.5}
          x2={cx}
          y2={cy - radius * 0.7}
          stroke="#00fff2"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polygon
          points={`${cx},${cy - radius * 0.7} ${cx - 5},${cy - radius * 0.5} ${cx + 5},${cy - radius * 0.5}`}
          fill="#00fff2"
        />
      </g>

      {/* Speed in center */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#00fff2"
        fontSize={size * 0.14}
        fontFamily="var(--font-mono)"
      >
        {Math.round(speed)}
      </text>
    </svg>
  );
}
