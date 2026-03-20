import { WMO_CODES, UV_LEVELS, AQI_LEVELS, WIND_DIRECTIONS } from "./constants";

export function formatTemp(temp: number): string {
  return `${Math.round(temp)}°`;
}

export function formatTempFull(temp: number): string {
  return `${Math.round(temp)}°C`;
}

export function formatWind(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

export function formatVisibility(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatPressure(hpa: number): string {
  return `${Math.round(hpa)} hPa`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTimeShort(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-NZ", {
    hour: "numeric",
    hour12: true,
  });
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDayName(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-NZ", { weekday: "short" });
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

export function getWeatherDescription(code: number): string {
  return WMO_CODES[code]?.description ?? "Unknown";
}

export function getWeatherCondition(code: number): string {
  return WMO_CODES[code]?.condition ?? "unknown";
}

export function getWindDirection(degrees: number): string {
  const index = Math.round(degrees / 22.5) % 16;
  return WIND_DIRECTIONS[index];
}

export function getUVLevel(index: number) {
  return UV_LEVELS.find((l) => index <= l.max) ?? UV_LEVELS[UV_LEVELS.length - 1];
}

export function getAQILevel(aqi: number) {
  return AQI_LEVELS.find((l) => aqi <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1];
}

export function getPressureTrend(
  current: number,
  hourlyPressures: number[],
  hourlyTimes: string[]
): "rising" | "falling" | "steady" {
  // Compare to pressure 3 hours ago
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  let pastPressure = current;
  for (let i = hourlyTimes.length - 1; i >= 0; i--) {
    if (new Date(hourlyTimes[i]) <= threeHoursAgo) {
      pastPressure = hourlyPressures[i];
      break;
    }
  }

  const diff = current - pastPressure;
  if (diff > 1) return "rising";
  if (diff < -1) return "falling";
  return "steady";
}

export function getSafeExposureMinutes(uvIndex: number): number | null {
  // Rough estimate based on skin type III (medium)
  if (uvIndex <= 0) return null;
  const minutes = Math.round(200 / (3 * uvIndex));
  return Math.max(10, minutes);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
