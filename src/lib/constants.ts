/** WMO Weather interpretation codes → condition + description */
export const WMO_CODES: Record<number, { condition: string; description: string }> = {
  0: { condition: "clear", description: "Clear sky" },
  1: { condition: "clear", description: "Mainly clear" },
  2: { condition: "partly-cloudy", description: "Partly cloudy" },
  3: { condition: "overcast", description: "Overcast" },
  45: { condition: "fog", description: "Fog" },
  48: { condition: "fog", description: "Depositing rime fog" },
  51: { condition: "drizzle", description: "Light drizzle" },
  53: { condition: "drizzle", description: "Moderate drizzle" },
  55: { condition: "drizzle", description: "Dense drizzle" },
  56: { condition: "drizzle", description: "Freezing light drizzle" },
  57: { condition: "drizzle", description: "Freezing dense drizzle" },
  61: { condition: "rain", description: "Slight rain" },
  63: { condition: "rain", description: "Moderate rain" },
  65: { condition: "rain", description: "Heavy rain" },
  66: { condition: "rain", description: "Freezing light rain" },
  67: { condition: "rain", description: "Freezing heavy rain" },
  71: { condition: "snow", description: "Slight snowfall" },
  73: { condition: "snow", description: "Moderate snowfall" },
  75: { condition: "snow", description: "Heavy snowfall" },
  77: { condition: "snow", description: "Snow grains" },
  80: { condition: "rain", description: "Slight rain showers" },
  81: { condition: "rain", description: "Moderate rain showers" },
  82: { condition: "rain", description: "Violent rain showers" },
  85: { condition: "snow", description: "Slight snow showers" },
  86: { condition: "snow", description: "Heavy snow showers" },
  95: { condition: "thunderstorm", description: "Thunderstorm" },
  96: { condition: "thunderstorm", description: "Thunderstorm with slight hail" },
  99: { condition: "thunderstorm", description: "Thunderstorm with heavy hail" },
};

export const UV_LEVELS = [
  { max: 2, label: "Low", color: "#00ff88" },
  { max: 5, label: "Moderate", color: "#ffb800" },
  { max: 7, label: "High", color: "#ff8800" },
  { max: 10, label: "Very High", color: "#ff3366" },
  { max: Infinity, label: "Extreme", color: "#ff00ff" },
] as const;

export const AQI_LEVELS = [
  { max: 50, label: "Good", color: "#00ff88" },
  { max: 100, label: "Moderate", color: "#ffb800" },
  { max: 150, label: "Unhealthy for Sensitive", color: "#ff8800" },
  { max: 200, label: "Unhealthy", color: "#ff3366" },
  { max: 300, label: "Very Unhealthy", color: "#cc00cc" },
  { max: Infinity, label: "Hazardous", color: "#800020" },
] as const;

export const WIND_DIRECTIONS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
] as const;

export const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
export const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
export const CACHE_KEY = "stormgrid-weather-cache";
export const LOCATION_KEY = "stormgrid-location";
