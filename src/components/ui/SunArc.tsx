"use client";

interface SunArcProps {
  sunrise: string;
  sunset: string;
  currentTime?: Date;
  width?: number;
  height?: number;
}

/**
 * Visual arc showing the sun's path from sunrise to sunset,
 * with current position indicated.
 */
export function SunArc({
  sunrise,
  sunset,
  currentTime = new Date(),
  width = 280,
  height = 100,
}: SunArcProps) {
  const riseTime = new Date(sunrise).getTime();
  const setTime = new Date(sunset).getTime();
  const now = currentTime.getTime();

  const dayDuration = setTime - riseTime;
  const progress = Math.max(0, Math.min(1, (now - riseTime) / dayDuration));
  const isDayTime = now >= riseTime && now <= setTime;

  const padding = 20;
  const arcWidth = width - padding * 2;
  const arcHeight = height - 30;

  // Sun position along arc
  const sunAngle = Math.PI * progress;
  const sunX = padding + progress * arcWidth;
  const sunY = height - 20 - Math.sin(sunAngle) * arcHeight;

  // Arc path (semicircle)
  const arcPath = `M ${padding} ${height - 20} Q ${width / 2} ${-arcHeight * 0.5} ${width - padding} ${height - 20}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Horizon line */}
      <line
        x1={padding - 5}
        y1={height - 20}
        x2={width - padding + 5}
        y2={height - 20}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      {/* Arc path (background) */}
      <path
        d={arcPath}
        fill="none"
        stroke="rgba(255,184,0,0.15)"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />

      {/* Arc path (progress) */}
      {isDayTime && (
        <path
          d={arcPath}
          fill="none"
          stroke="#ffb800"
          strokeWidth="2"
          strokeDasharray={`${progress * 300} 300`}
          style={{ filter: "drop-shadow(0 0 4px rgba(255,184,0,0.4))" }}
        />
      )}

      {/* Sun indicator */}
      {isDayTime && (
        <g>
          <circle cx={sunX} cy={sunY} r="6" fill="#ffb800" opacity="0.9">
            <animate
              attributeName="r"
              values="5;7;5"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={sunX} cy={sunY} r="10" fill="none" stroke="#ffb800" strokeWidth="0.5" opacity="0.4">
            <animate
              attributeName="r"
              values="10;14;10"
              dur="3s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0.1;0.4"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}

      {/* Sunrise label */}
      <text
        x={padding}
        y={height - 4}
        textAnchor="middle"
        fill="#8888aa"
        fontSize="9"
        fontFamily="var(--font-mono)"
      >
        {formatShortTime(sunrise)}
      </text>

      {/* Sunset label */}
      <text
        x={width - padding}
        y={height - 4}
        textAnchor="middle"
        fill="#8888aa"
        fontSize="9"
        fontFamily="var(--font-mono)"
      >
        {formatShortTime(sunset)}
      </text>
    </svg>
  );
}

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
