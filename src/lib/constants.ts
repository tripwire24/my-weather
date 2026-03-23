// Refresh intervals
export const AUTO_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
export const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// Open-Meteo endpoints
export const OPENMETEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const OPENMETEO_AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
export const OPENMETEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// WMO Weather interpretation codes
export const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Clear sky',              icon: 'clear' },
  1:  { label: 'Mainly clear',           icon: 'mostly-clear' },
  2:  { label: 'Partly cloudy',          icon: 'partly-cloudy' },
  3:  { label: 'Overcast',               icon: 'overcast' },
  45: { label: 'Fog',                    icon: 'fog' },
  48: { label: 'Rime fog',               icon: 'fog' },
  51: { label: 'Light drizzle',          icon: 'drizzle' },
  53: { label: 'Drizzle',                icon: 'drizzle' },
  55: { label: 'Heavy drizzle',          icon: 'drizzle' },
  56: { label: 'Freezing drizzle',       icon: 'drizzle' },
  57: { label: 'Heavy freezing drizzle', icon: 'drizzle' },
  61: { label: 'Light rain',             icon: 'rain' },
  63: { label: 'Rain',                   icon: 'rain' },
  65: { label: 'Heavy rain',             icon: 'rain-heavy' },
  66: { label: 'Freezing rain',          icon: 'sleet' },
  67: { label: 'Heavy freezing rain',    icon: 'sleet' },
  71: { label: 'Light snow',             icon: 'snow' },
  73: { label: 'Snow',                   icon: 'snow' },
  75: { label: 'Heavy snow',             icon: 'snow-heavy' },
  77: { label: 'Snow grains',            icon: 'snow' },
  80: { label: 'Light showers',          icon: 'showers' },
  81: { label: 'Showers',                icon: 'showers' },
  82: { label: 'Violent showers',        icon: 'showers-heavy' },
  85: { label: 'Snow showers',           icon: 'snow-showers' },
  86: { label: 'Heavy snow showers',     icon: 'snow-showers' },
  95: { label: 'Thunderstorm',           icon: 'thunderstorm' },
  96: { label: 'Thunderstorm with hail', icon: 'thunderstorm-hail' },
  99: { label: 'Thunderstorm with hail', icon: 'thunderstorm-hail' },
};

// Wind direction sectors
export const WIND_DIRECTIONS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

// UV Index categories
export const UV_CATEGORIES = [
  { max: 2,   label: 'Low',       color: '#00ff88', safeMinutes: null },
  { max: 5,   label: 'Moderate',  color: '#ffff00', safeMinutes: 60 },
  { max: 7,   label: 'High',      color: '#ff9900', safeMinutes: 30 },
  { max: 10,  label: 'Very High', color: '#ff3355', safeMinutes: 15 },
  { max: Infinity, label: 'Extreme', color: '#ff00ff', safeMinutes: 10 },
];

// AQI categories
export const AQI_CATEGORIES = [
  { max: 20,  label: 'Good',      color: '#00ff88' },
  { max: 40,  label: 'Fair',      color: '#00fff2' },
  { max: 60,  label: 'Moderate',  color: '#ffff00' },
  { max: 80,  label: 'Poor',      color: '#ff9900' },
  { max: 100, label: 'Very Poor', color: '#ff3355' },
  { max: Infinity, label: 'Hazardous', color: '#ff00ff' },
];

// Local storage keys
export const STORAGE_KEYS = {
  LOCATION: 'sg_location',
  WEATHER_CACHE: 'sg_weather_cache',
  LAST_FETCHED: 'sg_last_fetched',
} as const;
