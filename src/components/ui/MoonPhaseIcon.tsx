"use client";

interface MoonPhaseIconProps {
  phase: number; // 0-1
  size?: number;
}

/**
 * SVG moon phase visualization.
 * Phase 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
 */
export function MoonPhaseIcon({ phase, size = 48 }: MoonPhaseIconProps) {
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  // Calculate the illuminated portion using a parametric approach
  // The terminator is an ellipse with varying x-radius
  let sweepOuter: number;
  let terminatorRx: number;

  if (phase <= 0.5) {
    // Waxing: right side illuminated
    sweepOuter = 1;
    terminatorRx = r * Math.abs(1 - 4 * phase);
  } else {
    // Waning: left side illuminated
    sweepOuter = 0;
    terminatorRx = r * Math.abs(1 - 4 * (1 - phase));
  }

  const terminatorDir = phase <= 0.25 || phase > 0.75 ? 0 : 1;

  // Build the illuminated area path
  const topY = cy - r;
  const botY = cy + r;

  // Outer arc (half circle, always the illuminated side)
  const outerPath = `M ${cx} ${topY} A ${r} ${r} 0 0 ${sweepOuter} ${cx} ${botY}`;
  // Terminator arc (ellipse connecting top to bottom through the center)
  const terminatorPath = `A ${terminatorRx} ${r} 0 0 ${terminatorDir} ${cx} ${topY}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Moon background (dark side) */}
      <circle cx={cx} cy={cy} r={r} fill="#1a1a2e" stroke="rgba(0,255,242,0.2)" strokeWidth="1" />
      {/* Illuminated portion */}
      <path
        d={`${outerPath} ${terminatorPath}`}
        fill="#d4d4e8"
        opacity="0.85"
        style={{ filter: "drop-shadow(0 0 4px rgba(212,212,232,0.3))" }}
      />
      {/* Subtle crater details */}
      <circle cx={cx - r * 0.2} cy={cy - r * 0.15} r={r * 0.1} fill="rgba(0,0,0,0.1)" />
      <circle cx={cx + r * 0.25} cy={cy + r * 0.3} r={r * 0.08} fill="rgba(0,0,0,0.08)" />
    </svg>
  );
}
