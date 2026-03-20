"use client";

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
}

/**
 * Minimal geometric/line-art weather icons in Tron style.
 * Uses SVG with neon glow effects.
 */
export function WeatherIcon({
  code,
  isDay = true,
  size = 32,
  className = "",
}: WeatherIconProps) {
  const condition = getConditionFromCode(code);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label={condition}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {renderIcon(condition, isDay)}
    </svg>
  );
}

function getConditionFromCode(code: number): string {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly-cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code >= 95) return "thunderstorm";
  return "clear";
}

function renderIcon(condition: string, isDay: boolean) {
  const cyan = "#00fff2";
  const magenta = "#ff00ff";
  const amber = "#ffb800";
  const blue = "#4d7cff";
  const white = "#e8e8f0";

  switch (condition) {
    case "clear":
      return isDay ? (
        // Sun: geometric circle with radiating lines
        <g filter="url(#glow)">
          <circle cx="24" cy="24" r="8" stroke={amber} strokeWidth="2" fill="none" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 24 + Math.cos(rad) * 12;
            const y1 = 24 + Math.sin(rad) * 12;
            const x2 = 24 + Math.cos(rad) * 16;
            const y2 = 24 + Math.sin(rad) * 16;
            return (
              <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={amber} strokeWidth="1.5" strokeLinecap="round" />
            );
          })}
        </g>
      ) : (
        // Moon: crescent
        <g filter="url(#glow)">
          <path d="M28 10a14 14 0 1 0 0 28 10 10 0 0 1 0-28z" stroke={cyan} strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="16" r="1" fill={cyan} opacity="0.4" />
          <circle cx="32" cy="28" r="0.8" fill={cyan} opacity="0.3" />
        </g>
      );

    case "partly-cloudy":
      return (
        <g filter="url(#glow)">
          {isDay && (
            <>
              <circle cx="18" cy="16" r="6" stroke={amber} strokeWidth="1.5" fill="none" />
              {[0, 60, 120, 180, 240, 300].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                return (
                  <line key={angle} x1={18 + Math.cos(rad) * 8} y1={16 + Math.sin(rad) * 8} x2={18 + Math.cos(rad) * 10} y2={16 + Math.sin(rad) * 10} stroke={amber} strokeWidth="1" strokeLinecap="round" />
                );
              })}
            </>
          )}
          <path d="M14 32h24M16 28h20c2 0 4-2 4-4s-2-4-4-4h-1c0-4-3-7-7-7s-7 3-7 7h-1c-2 0-4 2-4 4s2 4 4 4z" stroke={white} strokeWidth="1.5" fill="none" opacity="0.7" />
        </g>
      );

    case "overcast":
      return (
        <g filter="url(#glow)">
          <path d="M10 30h28M12 26h24c2 0 3.5-1.5 3.5-3.5S38 19 36 19h-1c-.5-4-3.5-7-7.5-7S21 15 20.5 19H20c-2 0-3.5 1.5-3.5 3.5S18 26 20 26z" stroke={white} strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M8 36h32M10 32h28c2.5 0 4-2 4-4s-1.5-4-4-4h-1c-.5-4.5-4-8-8.5-8S22 20 21.5 24.5H21c-2.5 0-4 2-4 4s1.5 4 4 4z" stroke={white} strokeWidth="1.5" fill="none" opacity="0.7" />
        </g>
      );

    case "fog":
      return (
        <g filter="url(#glow)">
          {[18, 24, 30, 36].map((y) => (
            <line key={y} x1="8" y1={y} x2="40" y2={y} stroke={white} strokeWidth="1.5" strokeLinecap="round" opacity={0.3 + (y - 18) * 0.05} strokeDasharray="4 3" />
          ))}
        </g>
      );

    case "drizzle":
      return (
        <g filter="url(#glow)">
          <path d="M14 24h20c2 0 3-1.5 3-3s-1-3-3-3h-1c-.5-3.5-3-6-6.5-6S20 14.5 19.5 18H19c-2 0-3 1.5-3 3s1 3 3 3z" stroke={white} strokeWidth="1.5" fill="none" opacity="0.6" />
          {[18, 24, 30].map((x) => (
            <line key={x} x1={x} y1="28" x2={x} y2="32" stroke={cyan} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          ))}
        </g>
      );

    case "rain":
      return (
        <g filter="url(#glow)">
          <path d="M12 22h24c2 0 3.5-1.5 3.5-3.5S38 15 36 15h-1c-.5-4-3.5-7-7.5-7S21 11 20.5 15H20c-2 0-3.5 1.5-3.5 3.5S18 22 20 22z" stroke={white} strokeWidth="1.5" fill="none" opacity="0.6" />
          {[16, 22, 28, 34].map((x, i) => (
            <line key={x} x1={x} y1={26 + (i % 2) * 2} x2={x - 2} y2={33 + (i % 2) * 2} stroke={blue} strokeWidth="1.5" strokeLinecap="round" />
          ))}
        </g>
      );

    case "snow":
      return (
        <g filter="url(#glow)">
          <path d="M12 22h24c2 0 3.5-1.5 3.5-3.5S38 15 36 15h-1c-.5-4-3.5-7-7.5-7S21 11 20.5 15H20c-2 0-3.5 1.5-3.5 3.5S18 22 20 22z" stroke={white} strokeWidth="1.5" fill="none" opacity="0.6" />
          {[17, 24, 31].map((x) => (
            <g key={x}>
              <line x1={x - 3} y1="32" x2={x + 3} y2="32" stroke={white} strokeWidth="1" />
              <line x1={x} y1="29" x2={x} y2="35" stroke={white} strokeWidth="1" />
              <line x1={x - 2} y1="30" x2={x + 2} y2="34" stroke={white} strokeWidth="1" />
              <line x1={x + 2} y1="30" x2={x - 2} y2="34" stroke={white} strokeWidth="1" />
            </g>
          ))}
        </g>
      );

    case "thunderstorm":
      return (
        <g filter="url(#glow)">
          <path d="M12 20h24c2 0 3.5-1.5 3.5-3.5S38 13 36 13h-1c-.5-4-3.5-7-7.5-7S21 9 20.5 13H20c-2 0-3.5 1.5-3.5 3.5S18 20 20 20z" stroke={white} strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M22 22l-2 8h6l-3 10 8-12h-6l3-6z" stroke={amber} strokeWidth="1.5" fill={amber} fillOpacity="0.3" />
        </g>
      );

    default:
      return (
        <circle cx="24" cy="24" r="8" stroke={cyan} strokeWidth="1.5" fill="none" />
      );
  }
}
