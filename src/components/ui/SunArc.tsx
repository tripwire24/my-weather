'use client';

import { formatTime } from '@/lib/formatters';

interface SunArcProps {
  sunrise: string;
  sunset: string;
  position: number; // 0–1 through the daylight arc
  goldenHourMorningEnd?: string;
  goldenHourEveningStart?: string;
  solarNoon?: string;
  width?: number;
  height?: number;
}

export function SunArc({
  sunrise,
  sunset,
  position,
  goldenHourMorningEnd,
  goldenHourEveningStart,
  solarNoon,
  width = 300,
  height = 130,
}: SunArcProps) {
  // Arc geometry: center below SVG so we get a perfect half-dome
  const cx = width / 2;
  const cy = height + 8;          // center below svg viewport
  const R  = height * 1.05;       // radius slightly larger than height

  // Arc spans from -165° to -15° (left to right, above center)
  const DEG = Math.PI / 180;
  const startAngle = -165 * DEG;
  const endAngle   = -15  * DEG;
  const totalAngle = endAngle - startAngle;

  function angleToXY(angle: number) {
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  }

  // Key points on arc
  const arcStart = angleToXY(startAngle);
  const arcEnd   = angleToXY(endAngle);

  // Horizon Y is where arc endpoints sit
  const horizonY = (arcStart.y + arcEnd.y) / 2;

  // Full arc path
  const fullArcPath = `M ${arcStart.x.toFixed(1)} ${arcStart.y.toFixed(1)} A ${R} ${R} 0 0 1 ${arcEnd.x.toFixed(1)} ${arcEnd.y.toFixed(1)}`;

  // Golden hour zones (as fractions 0–1 of the arc)
  const goldenMorningEnd   = goldenHourMorningEnd   ? timeToPosition(sunrise, sunset, goldenHourMorningEnd)   : 0.12;
  const goldenEveningStart = goldenHourEveningStart ? timeToPosition(sunrise, sunset, goldenHourEveningStart) : 0.88;

  // Build an arc segment between two positions
  function arcSegment(from: number, to: number): string {
    const a0 = startAngle + totalAngle * Math.max(0, from);
    const a1 = startAngle + totalAngle * Math.min(1, to);
    const p0 = angleToXY(a0);
    const p1 = angleToXY(a1);
    return `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A ${R} ${R} 0 0 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  // Current sun position
  const clampedPos = Math.max(0, Math.min(1, position));
  const sunAngle   = startAngle + totalAngle * clampedPos;
  const sunPos     = angleToXY(sunAngle);
  const isAboveHorizon = position > 0 && position < 1;

  // Solar noon dot on arc
  const noonPos   = angleToXY(startAngle + totalAngle * 0.5);

  // Sky gradient: top of arc → horizon
  // Compute topmost point of arc (at angle = -90°, straight up)
  const topY = cy - R;  // when angle = -90°, y = cy + R*sin(-90°) = cy - R
  const skyH = horizonY - topY;

  // Determine sky colours based on position (time of day feel)
  const skyTop    = getSkyTop(position);
  const skyBottom = getSkyBottom(position);

  // IDs must be unique per instance — use a simple hash
  const uid = `sun-${width}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      overflow="visible"
      style={{ display: 'block' }}
      aria-label={`Sun position: ${Math.round(position * 100)}% through the day`}
    >
      <defs>
        {/* Sky atmosphere gradient (vertical) */}
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={skyTop}    stopOpacity={0.55} />
          <stop offset="100%" stopColor={skyBottom} stopOpacity={0.15} />
        </linearGradient>

        {/* Elapsed arc gradient: sunrise amber → noon yellow → current */}
        <linearGradient id={`${uid}-elapsed`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#ff8800" stopOpacity={0.9} />
          <stop offset="45%"  stopColor="#ffcc00" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#ffee44" stopOpacity={0.9} />
        </linearGradient>

        {/* Sun corona radial glow */}
        <radialGradient id={`${uid}-corona`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity={0.95} />
          <stop offset="25%"  stopColor="#ffe566" stopOpacity={0.85} />
          <stop offset="60%"  stopColor="#ffaa00" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ff8800" stopOpacity={0} />
        </radialGradient>

        {/* Horizon glow gradient */}
        <linearGradient id={`${uid}-horizon`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ffaa44" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#ffaa44" stopOpacity={0} />
        </linearGradient>

        {/* Clip to SVG viewport */}
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width={width} height={height} />
        </clipPath>
      </defs>

      {/* ── Sky background dome ── */}
      <ellipse
        cx={cx} cy={horizonY}
        rx={R * 1.05} ry={skyH * 1.02}
        fill={`url(#${uid}-sky)`}
        clipPath={`url(#${uid}-clip)`}
      />

      {/* ── Horizon atmospheric haze ── */}
      <rect
        x={arcStart.x - 10} y={horizonY - 10}
        width={arcEnd.x - arcStart.x + 20} height={14}
        fill={`url(#${uid}-horizon)`}
        clipPath={`url(#${uid}-clip)`}
      />

      {/* ── Horizon line ── */}
      <line
        x1={arcStart.x - 6} y1={horizonY}
        x2={arcEnd.x + 6}   y2={horizonY}
        stroke="rgba(92, 224, 214,0.2)"
        strokeWidth={1}
        strokeDasharray="5 4"
      />

      {/* ── Track arc (full day path) ── */}
      <path
        d={fullArcPath}
        fill="none"
        stroke="rgba(92, 224, 214,0.12)"
        strokeWidth={2}
        strokeDasharray="5 4"
        clipPath={`url(#${uid}-clip)`}
      />

      {/* ── Golden hour morning zone ── */}
      {goldenMorningEnd > 0 && (
        <path
          d={arcSegment(0, goldenMorningEnd)}
          fill="none"
          stroke="rgba(255,140,30,0.55)"
          strokeWidth={4}
          strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}
        />
      )}

      {/* ── Golden hour evening zone ── */}
      {goldenEveningStart < 1 && (
        <path
          d={arcSegment(goldenEveningStart, 1)}
          fill="none"
          stroke="rgba(255,100,20,0.55)"
          strokeWidth={4}
          strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}
        />
      )}

      {/* ── Elapsed arc (sunrise → sun) ── */}
      {isAboveHorizon && clampedPos > 0.01 && (
        <path
          d={arcSegment(0, clampedPos)}
          fill="none"
          stroke={`url(#${uid}-elapsed)`}
          strokeWidth={2.5}
          strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,200,0,0.7))' }}
        />
      )}

      {/* ── Solar noon tick mark ── */}
      {isAboveHorizon && (
        <g clipPath={`url(#${uid}-clip)`}>
          {/* Noon dot on track */}
          <circle
            cx={noonPos.x} cy={noonPos.y} r={3}
            fill="rgba(255,255,100,0.6)"
            stroke="rgba(255,255,80,0.5)"
            strokeWidth={1}
          />
          {/* Noon label above */}
          {solarNoon && (
            <text
              x={noonPos.x} y={noonPos.y - 8}
              textAnchor="middle"
              fontSize={7.5}
              fontFamily="'JetBrains Mono', monospace"
              fill="rgba(255,240,80,0.7)"
            >
              {formatTime(solarNoon)}
            </text>
          )}
        </g>
      )}

      {/* ── Sun indicator (above horizon) ── */}
      {isAboveHorizon && (
        <g clipPath={`url(#${uid}-clip)`}>
          {/* Outer corona */}
          <circle
            cx={sunPos.x} cy={sunPos.y} r={18}
            fill={`url(#${uid}-corona)`}
            opacity={0.6}
          />
          {/* Mid halo */}
          <circle
            cx={sunPos.x} cy={sunPos.y} r={9}
            fill="rgba(255,220,50,0.35)"
            style={{ filter: 'blur(2px)' }}
          />
          {/* Sun disc */}
          <circle
            cx={sunPos.x} cy={sunPos.y} r={5}
            fill="#ffe566"
            style={{ filter: 'drop-shadow(0 0 8px #ffcc00) drop-shadow(0 0 4px #ffaa00)' }}
          />
          {/* Ray lines */}
          {[0, 45, 90, 135].map(deg => {
            const a = deg * DEG;
            const len = 6;
            const dx = Math.cos(a) * (5 + len);
            const dy = Math.sin(a) * (5 + len);
            const dx0 = Math.cos(a) * 7;
            const dy0 = Math.sin(a) * 7;
            return (
              <g key={deg}>
                <line
                  x1={sunPos.x + dx0} y1={sunPos.y + dy0}
                  x2={sunPos.x + dx}  y2={sunPos.y + dy}
                  stroke="rgba(255,220,80,0.6)" strokeWidth={1.2} strokeLinecap="round"
                />
                <line
                  x1={sunPos.x - dx0} y1={sunPos.y - dy0}
                  x2={sunPos.x - dx}  y2={sunPos.y - dy}
                  stroke="rgba(255,220,80,0.6)" strokeWidth={1.2} strokeLinecap="round"
                />
              </g>
            );
          })}
        </g>
      )}

      {/* ── Night indicator (sun below horizon) ── */}
      {!isAboveHorizon && (
        <text
          x={cx} y={horizonY - 12}
          textAnchor="middle"
          fontSize={8.5}
          fontFamily="'JetBrains Mono', monospace"
          fill="rgba(0,232,255,0.45)"
        >
          {position <= 0 ? '↑ SUN BELOW HORIZON' : 'SUN SET ↓'}
        </text>
      )}

      {/* ── Sunrise label ── */}
      <text
        x={arcStart.x + 2}
        y={horizonY + 13}
        textAnchor="start"
        fontSize={8.5}
        fontFamily="'JetBrains Mono', monospace"
        fill="rgba(255,160,40,0.75)"
      >
        ↑ {formatTime(sunrise)}
      </text>

      {/* ── Sunset label ── */}
      <text
        x={arcEnd.x - 2}
        y={horizonY + 13}
        textAnchor="end"
        fontSize={8.5}
        fontFamily="'JetBrains Mono', monospace"
        fill="rgba(255,100,20,0.75)"
      >
        {formatTime(sunset)} ↓
      </text>

      {/* ── Position % label (when above horizon) ── */}
      {isAboveHorizon && (
        <text
          x={cx}
          y={height - 2}
          textAnchor="middle"
          fontSize={7.5}
          fontFamily="'JetBrains Mono', monospace"
          fill="rgba(92, 224, 214,0.35)"
        >
          {Math.round(clampedPos * 100)}% THROUGH THE DAY
        </text>
      )}
    </svg>
  );
}

// Convert an ISO timestamp to 0–1 position within the sunrise–sunset window
function timeToPosition(sunriseISO: string, sunsetISO: string, timeISO: string): number {
  const rise = new Date(sunriseISO).getTime();
  const set  = new Date(sunsetISO).getTime();
  const t    = new Date(timeISO).getTime();
  if (set <= rise) return 0;
  return Math.max(0, Math.min(1, (t - rise) / (set - rise)));
}

// Adaptive sky colour based on sun position
function getSkyTop(pos: number): string {
  if (pos <= 0 || pos >= 1) return '#060820'; // night
  if (pos < 0.08)  return '#1a0820'; // pre-dawn deep purple
  if (pos < 0.18)  return '#4a1a10'; // dawn orange-red
  if (pos < 0.28)  return '#1a3a6a'; // morning blue
  if (pos < 0.72)  return '#0a1e4a'; // midday deep blue
  if (pos < 0.82)  return '#1a3a6a'; // afternoon blue
  if (pos < 0.92)  return '#4a1a10'; // dusk
  return '#1a0820';                  // post-dusk
}

function getSkyBottom(pos: number): string {
  if (pos <= 0 || pos >= 1) return '#0a0a20';
  if (pos < 0.08)  return '#220a20';
  if (pos < 0.18)  return '#aa4418'; // dawn orange glow
  if (pos < 0.28)  return '#2255aa'; // morning sky
  if (pos < 0.72)  return '#1a5599'; // midday sky
  if (pos < 0.82)  return '#2255aa';
  if (pos < 0.92)  return '#aa4418'; // dusk orange
  return '#220a20';
}
