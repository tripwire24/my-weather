'use client';

interface MoonPhaseIconProps {
  phase: number; // 0-1
  size?: number;
  color?: string;
}

export function MoonPhaseIcon({ phase, size = 48, color = '#00fff2' }: MoonPhaseIconProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  // Phase 0/1 = new moon, 0.5 = full moon
  // We render the lit portion as a combination of two arcs
  const illuminatedSide = phase <= 0.5 ? 'right' : 'left';
  const p = phase <= 0.5 ? phase * 2 : (phase - 0.5) * 2; // 0-1 for each half-cycle

  // The terminator x-offset (cos of angle)
  // p=0 → terminator at left edge (new moon), p=1 → terminator at right edge (full moon)
  const terminatorX = r * Math.cos(Math.PI * (1 - p));

  // Build the lit area as path:
  // Right half of circle + terminator ellipse
  const isWaxing = phase < 0.5;
  const isNew = phase < 0.02 || phase > 0.98;
  const isFull = phase > 0.48 && phase < 0.52;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Dark circle base */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(0,0,0,0.6)" stroke={color} strokeWidth={1} opacity={0.4} />

      {isNew ? null : isFull ? (
        <>
          <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.15} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1.5}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </>
      ) : (
        <MoonLitPath
          cx={cx} cy={cy} r={r}
          phase={phase}
          color={color}
        />
      )}

      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={0.8} opacity={0.3} />
    </svg>
  );
}

function MoonLitPath({ cx, cy, r, phase, color }: {
  cx: number; cy: number; r: number; phase: number; color: string;
}) {
  // Build the lit crescent/gibbous shape
  const isWaxing = phase < 0.5;
  const normalised = isWaxing ? phase * 2 : (phase - 0.5) * 2;

  // Terminator offset: -r (full lit) to r (nothing lit)
  // Waxing: starts dark (terminator at +r) → moves to -r (full)
  // Waning: starts full (-r) → moves to +r (dark)
  const tx = isWaxing
    ? r - normalised * 2 * r  // waxing: terminator moves left
    : -r + normalised * 2 * r; // waning: terminator moves right

  // rx of the elliptical terminator
  const ellRx = Math.abs(tx);
  const litIsRight = isWaxing;

  // Path: right semicircle (if waxing lit side) + terminator ellipse
  // For waxing: lit on right side
  // For waning: lit on left side
  if (ellRx < 0.5) {
    // Nearly full or new — just show a circle
    return (
      <circle cx={cx} cy={cy} r={r}
        fill={color} opacity={litIsRight ? 0.15 : 0.05}
        stroke={color} strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    );
  }

  // Lit crescent path using SVG arcs
  const topY = cy - r;
  const botY = cy + r;

  // Outer arc: half of the main circle (lit side)
  // Inner arc: the terminator ellipse
  const litSweep = litIsRight ? 1 : 0;
  const termSweep = litIsRight ? 0 : 1;
  const termFlip = tx > 0 ? 1 : 0;

  const path = `
    M ${cx} ${topY}
    A ${r} ${r} 0 0 ${litSweep} ${cx} ${botY}
    A ${ellRx} ${r} 0 0 ${termFlip} ${cx} ${topY}
    Z
  `;

  return (
    <path
      d={path}
      fill={color}
      opacity={0.2}
      stroke={color}
      strokeWidth={0.8}
      style={{ filter: `drop-shadow(0 0 4px ${color})` }}
    />
  );
}
