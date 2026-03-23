import { WIND_DIRECTIONS, WMO_CODES, UV_CATEGORIES, AQI_CATEGORIES } from '@/lib/constants';

// Temperature (Celsius)
export function formatTemp(celsius: number, showUnit = true): string {
  const rounded = Math.round(celsius);
  return showUnit ? `${rounded}°C` : `${rounded}°`;
}

// Wind speed (km/h)
export function formatWindSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

// Wind direction degrees → compass sector
export function windDegToDirection(degrees: number): string {
  const idx = Math.round(degrees / 22.5) % 16;
  return WIND_DIRECTIONS[idx];
}

// Pressure (hPa)
export function formatPressure(hpa: number): string {
  return `${Math.round(hpa)} hPa`;
}

// Visibility (km)
export function formatVisibility(km: number): string {
  if (km >= 10) return `${Math.round(km)} km`;
  return `${km.toFixed(1)} km`;
}

// Time — 12-hour format, NZ style
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-NZ', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Date — DD MMM YYYY
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-NZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Short date — Mon 21 Mar
export function formatShortDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// Day name — Monday
export function formatDayName(isoString: string, short = false): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-NZ', { weekday: short ? 'short' : 'long' });
}

// Relative time — "5 mins ago", "just now"
export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
}

// Duration in minutes → "6h 30m" or "45m"
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// WMO code → label
export function wmoLabel(code: number): string {
  return WMO_CODES[code]?.label ?? 'Unknown';
}

// WMO code → icon key
export function wmoIcon(code: number): string {
  return WMO_CODES[code]?.icon ?? 'clear';
}

// UV index → category info
export function uvCategory(index: number): { label: string; color: string; safeMinutes: number | null } {
  return UV_CATEGORIES.find(c => index <= c.max) ?? UV_CATEGORIES[UV_CATEGORIES.length - 1];
}

// AQI → category
export function aqiCategory(aqi: number): { label: string; color: string } {
  return AQI_CATEGORIES.find(c => aqi <= c.max) ?? AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

// Precipitation amount (mm)
export function formatPrecip(mm: number): string {
  if (mm < 0.1) return '0 mm';
  if (mm < 1) return `${mm.toFixed(1)} mm`;
  return `${Math.round(mm)} mm`;
}

// Percentage
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

// Hours offset label for hourly display e.g. "Now", "1h", "14:00"
export function formatHourLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffH = Math.round((date.getTime() - now.getTime()) / 3600000);
  if (Math.abs(diffH) < 1) return 'Now';
  return date.toLocaleTimeString('en-NZ', { hour: 'numeric', hour12: true }).toLowerCase();
}

// Countdown to date — "in 3 days", "in 2 months"
export function formatCountdown(isoString: string): string {
  const now = new Date();
  const target = new Date(isoString);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 31) return `in ${diffDays} days`;
  const months = Math.floor(diffDays / 30);
  return `in ${months} month${months > 1 ? 's' : ''}`;
}
