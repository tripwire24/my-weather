'use client';

/**
 * Tron-style geometric weather icons rendered as inline SVG.
 * No images, no icon fonts — pure SVG geometry.
 */

interface WeatherIconProps {
  code: number;      // WMO weather code
  isDay?: boolean;
  size?: number;
  color?: string;
  className?: string;
}

export function WeatherIcon({ code, isDay = true, size = 32, color = '#00fff2', className = '' }: WeatherIconProps) {
  const icon = getIconSVG(code, isDay, size, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ filter: `drop-shadow(0 0 ${size * 0.12}px ${color})`, flexShrink: 0 }}
      aria-hidden
    >
      {icon}
    </svg>
  );
}

function getIconSVG(code: number, isDay: boolean, s: number, c: string) {
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.3;
  const sw = Math.max(1, s * 0.055); // stroke width

  // Clear day / night
  if (code === 0) {
    if (isDay) {
      return <SunIcon cx={cx} cy={cy} r={r} sw={sw} c={c} />;
    } else {
      return <MoonIcon cx={cx} cy={cy} r={r} sw={sw} c={c} />;
    }
  }

  // Mainly clear
  if (code === 1) {
    if (isDay) return <SunIcon cx={cx} cy={cy} r={r * 0.85} sw={sw} c={c} />;
    return <MoonIcon cx={cx} cy={cy} r={r * 0.85} sw={sw} c={c} />;
  }

  // Partly cloudy
  if (code === 2) {
    return <PartlyCloudyIcon cx={cx} cy={cy} r={r} sw={sw} c={c} isDay={isDay} />;
  }

  // Overcast
  if (code === 3) return <CloudIcon cx={cx} cy={cy} r={r} sw={sw} c={c} />;

  // Fog
  if (code === 45 || code === 48) return <FogIcon cx={cx} cy={cy} r={r} sw={sw} c={c} s={s} />;

  // Drizzle
  if (code >= 51 && code <= 57) return <DrizzleIcon cx={cx} cy={cy} r={r} sw={sw} c={c} />;

  // Rain
  if (code >= 61 && code <= 67) return <RainIcon cx={cx} cy={cy} r={r} sw={sw} c={c} heavy={code === 65 || code === 67} />;

  // Snow
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <SnowIcon cx={cx} cy={cy} r={r} sw={sw} c={c} />;

  // Showers
  if (code >= 80 && code <= 82) return <ShowersIcon cx={cx} cy={cy} r={r} sw={sw} c={c} />;

  // Thunderstorm
  if (code >= 95) return <ThunderstormIcon cx={cx} cy={cy} r={r} sw={sw} c={c} />;

  // Default — sun
  return <SunIcon cx={cx} cy={cy} r={r} sw={sw} c={c} />;
}

// Sun: circle with rays
function SunIcon({ cx, cy, r, sw, c }: IconBaseProps) {
  const rays = 8;
  const innerR = r * 0.75;
  const outerR = r * 1.28;
  return (
    <g stroke={c} fill="none" strokeLinecap="round">
      <circle cx={cx} cy={cy} r={innerR} strokeWidth={sw} />
      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i * 360) / rays;
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={cx + Math.cos(rad) * (innerR + sw)}
            y1={cy + Math.sin(rad) * (innerR + sw)}
            x2={cx + Math.cos(rad) * outerR}
            y2={cy + Math.sin(rad) * outerR}
            strokeWidth={sw}
          />
        );
      })}
    </g>
  );
}

// Moon: crescent
function MoonIcon({ cx, cy, r, sw, c }: IconBaseProps) {
  return (
    <g stroke={c} fill="none" strokeWidth={sw}>
      <path
        d={`M ${cx} ${cy - r}
            A ${r} ${r} 0 1 1 ${cx + r * 0.3} ${cy + r * 0.95}
            A ${r * 0.85} ${r * 0.85} 0 1 0 ${cx} ${cy - r}
        `}
        strokeLinejoin="round"
      />
    </g>
  );
}

// Partly cloudy
function PartlyCloudyIcon({ cx, cy, r, sw, c, isDay }: IconBaseProps & { isDay: boolean }) {
  const sunCx = cx - r * 0.25;
  const sunCy = cy - r * 0.2;
  const sunR = r * 0.42;
  return (
    <g stroke={c} fill="none" strokeLinecap="round" strokeWidth={sw}>
      {isDay
        ? <circle cx={sunCx} cy={sunCy} r={sunR} />
        : (
          <path d={`M ${sunCx} ${sunCy - sunR} A ${sunR} ${sunR} 0 1 1 ${sunCx + sunR * 0.3} ${sunCy + sunR * 0.95} A ${sunR * 0.85} ${sunR * 0.85} 0 1 0 ${sunCx} ${sunCy - sunR}`} />
        )
      }
      <CloudShape cx={cx + r * 0.2} cy={cy + r * 0.2} r={r * 0.55} sw={sw} c={c} />
    </g>
  );
}

// Cloud
function CloudIcon({ cx, cy, r, sw, c }: IconBaseProps) {
  return (
    <g stroke={c} fill="none" strokeWidth={sw} strokeLinecap="round">
      <CloudShape cx={cx} cy={cy} r={r} sw={sw} c={c} />
    </g>
  );
}

// Reusable cloud shape
function CloudShape({ cx, cy, r, sw, c }: IconBaseProps) {
  const w = r * 1.9;
  const h = r * 0.9;
  return (
    <path
      stroke={c}
      fill="none"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      d={`
        M ${cx - w * 0.35} ${cy + h * 0.4}
        Q ${cx - w * 0.55} ${cy + h * 0.4} ${cx - w * 0.5} ${cy}
        Q ${cx - w * 0.5} ${cy - h * 0.6} ${cx - w * 0.1} ${cy - h * 0.5}
        Q ${cx} ${cy - h} ${cx + w * 0.2} ${cy - h * 0.5}
        Q ${cx + w * 0.55} ${cy - h * 0.5} ${cx + w * 0.5} ${cy}
        Q ${cx + w * 0.55} ${cy + h * 0.4} ${cx + w * 0.35} ${cy + h * 0.4}
        Z
      `}
    />
  );
}

// Fog
function FogIcon({ cx, cy, r, sw, c, s }: IconBaseProps & { s: number }) {
  const lines = 3;
  return (
    <g stroke={c} fill="none" strokeWidth={sw} strokeLinecap="round" opacity={0.9}>
      {Array.from({ length: lines }).map((_, i) => {
        const y = cy - r * 0.4 + i * r * 0.4;
        const w = s * 0.5 - i * s * 0.06;
        return <line key={i} x1={cx - w} y1={y} x2={cx + w} y2={y} />;
      })}
    </g>
  );
}

// Drizzle
function DrizzleIcon({ cx, cy, r, sw, c }: IconBaseProps) {
  return (
    <g stroke={c} fill="none" strokeWidth={sw} strokeLinecap="round">
      <CloudShape cx={cx} cy={cy - r * 0.2} r={r * 0.65} sw={sw} c={c} />
      {[-r * 0.3, 0, r * 0.3].map((ox, i) => (
        <line key={i} x1={cx + ox} y1={cy + r * 0.35} x2={cx + ox - r * 0.1} y2={cy + r * 0.65} strokeWidth={sw * 0.8} />
      ))}
    </g>
  );
}

// Rain
function RainIcon({ cx, cy, r, sw, c, heavy }: IconBaseProps & { heavy: boolean }) {
  return (
    <g stroke={c} fill="none" strokeWidth={sw} strokeLinecap="round">
      <CloudShape cx={cx} cy={cy - r * 0.25} r={r * 0.65} sw={sw} c={c} />
      {(heavy ? [-r * 0.35, -r * 0.1, r * 0.15, r * 0.4] : [-r * 0.25, r * 0.05, r * 0.35]).map((ox, i) => (
        <line key={i}
          x1={cx + ox} y1={cy + r * 0.35}
          x2={cx + ox - r * 0.15} y2={cy + r * 0.75}
          strokeWidth={heavy ? sw : sw * 0.9}
        />
      ))}
    </g>
  );
}

// Snow
function SnowIcon({ cx, cy, r, sw, c }: IconBaseProps) {
  return (
    <g stroke={c} fill="none" strokeWidth={sw} strokeLinecap="round">
      <CloudShape cx={cx} cy={cy - r * 0.2} r={r * 0.65} sw={sw} c={c} />
      {[-r * 0.25, r * 0.1].map((ox, i) => (
        <g key={i}>
          <line x1={cx + ox} y1={cy + r * 0.4} x2={cx + ox} y2={cy + r * 0.72} />
          <line x1={cx + ox - r * 0.12} y1={cy + r * 0.5} x2={cx + ox + r * 0.12} y2={cy + r * 0.5} />
          <line x1={cx + ox - r * 0.1} y1={cy + r * 0.42} x2={cx + ox + r * 0.1} y2={cy + r * 0.7} />
          <line x1={cx + ox + r * 0.1} y1={cy + r * 0.42} x2={cx + ox - r * 0.1} y2={cy + r * 0.7} />
        </g>
      ))}
    </g>
  );
}

// Showers (sun + rain)
function ShowersIcon({ cx, cy, r, sw, c }: IconBaseProps) {
  return (
    <g stroke={c} fill="none" strokeWidth={sw} strokeLinecap="round">
      <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.38} />
      <CloudShape cx={cx + r * 0.15} cy={cy + r * 0.05} r={r * 0.55} sw={sw} c={c} />
      {[-r * 0.15, r * 0.2].map((ox, i) => (
        <line key={i} x1={cx + ox} y1={cy + r * 0.55} x2={cx + ox - r * 0.12} y2={cy + r * 0.8} />
      ))}
    </g>
  );
}

// Thunderstorm
function ThunderstormIcon({ cx, cy, r, sw, c }: IconBaseProps) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <CloudShape cx={cx} cy={cy - r * 0.25} r={r * 0.65} sw={sw} c={c} />
      {/* Lightning bolt */}
      <path
        stroke="#ffb800"
        fill="none"
        strokeWidth={sw * 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d={`M ${cx + r * 0.1} ${cy + r * 0.3} L ${cx - r * 0.1} ${cy + r * 0.55} L ${cx + r * 0.05} ${cy + r * 0.55} L ${cx - r * 0.15} ${cy + r * 0.85}`}
        style={{ filter: 'drop-shadow(0 0 4px #ffb800)' }}
      />
    </g>
  );
}

interface IconBaseProps {
  cx: number;
  cy: number;
  r: number;
  sw: number;
  c: string;
}
