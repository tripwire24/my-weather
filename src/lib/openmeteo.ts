/**
 * Open-Meteo API client for StormGrid.
 * No API key required. https://open-meteo.com/
 */

import type { WeatherData, Location, HourlyForecast, DailyForecast, AirQuality, CurrentWeather } from '@/types/weather';
import {
  OPENMETEO_FORECAST_URL,
  OPENMETEO_AIR_QUALITY_URL,
} from '@/lib/constants';
import { getMoonPhase, getSolarTimes, getSunArcPosition, getCurrentSeason, getNextSeasonalEvent } from '@/lib/astronomy';

const HOURLY_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'dew_point_2m',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'uv_index',
  'visibility',
  'surface_pressure',
  'is_day',
].join(',');

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'sunrise',
  'sunset',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'wind_direction_10m_dominant',
  'uv_index_max',
  'precipitation_hours',
  'shortwave_radiation_sum',
].join(',');

const CURRENT_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'dew_point_2m',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'surface_pressure',
  'visibility',
  'uv_index',
  'is_day',
  'cloud_cover',
].join(',');

export async function fetchWeather(location: Location): Promise<WeatherData> {
  const { latitude, longitude, timezone } = location;
  const tz = timezone ?? 'auto';

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: tz,
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    current: CURRENT_VARS,
    forecast_days: '8',
    wind_speed_unit: 'kmh',
  });

  const [forecastRes, aqRes] = await Promise.allSettled([
    fetch(`${OPENMETEO_FORECAST_URL}?${params}`),
    fetch(`${OPENMETEO_AIR_QUALITY_URL}?latitude=${latitude}&longitude=${longitude}&hourly=pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,european_aqi&timezone=${tz}&forecast_days=1`),
  ]);

  if (forecastRes.status === 'rejected' || !forecastRes.value.ok) {
    throw new Error('Failed to fetch weather data from Open-Meteo');
  }

  const raw = await forecastRes.value.json();

  let airQuality: AirQuality | undefined;
  if (aqRes.status === 'fulfilled' && aqRes.value.ok) {
    const aqRaw = await aqRes.value.json();
    airQuality = parseAirQuality(aqRaw);
  }

  return parseWeatherResponse(raw, location, airQuality);
}

function parseWeatherResponse(raw: Record<string, unknown>, location: Location, airQuality?: AirQuality): WeatherData {
  const current = parseCurrent(raw);
  const hourly = parseHourly(raw);
  const daily = parseDaily(raw);
  const now = new Date();

  // Sun info from today's daily
  const today = daily[0];
  const solarTimes = getSolarTimes(today.sunrise, today.sunset);
  const sunArcPos = getSunArcPosition(today.sunrise, today.sunset, now);
  const dayLengthMs = new Date(today.sunset).getTime() - new Date(today.sunrise).getTime();
  const dayLengthMins = dayLengthMs / 60000;

  // Yesterday approximation (7th day before today if available, else estimate -2 min)
  const yesterday = daily[1]; // Not yesterday, but we'll use day 1 vs day 0 trend
  const tomorrowSolar = daily.length > 1
    ? getSolarTimes(daily[1].sunrise, daily[1].sunset)
    : solarTimes;
  const tomorrowDayLength = (
    new Date(daily[1]?.sunset ?? today.sunset).getTime() -
    new Date(daily[1]?.sunrise ?? today.sunrise).getTime()
  ) / 60000;
  const dayLengthChangeTodayMins = tomorrowDayLength - dayLengthMins;

  // Moon phase
  const moonPhase = getMoonPhase(now);

  // Astronomy
  const { season, daysRemaining } = getCurrentSeason(now, true); // NZ = southern hemisphere
  const { next: nextEvent, afterNext } = getNextSeasonalEvent(now, true);

  const isSolstice = nextEvent.type === 'summer-solstice' || nextEvent.type === 'winter-solstice';
  const isEquinox = !isSolstice;

  return {
    location,
    current,
    hourly: hourly.slice(0, 48), // next 48 hours
    daily,
    airQuality,
    sun: {
      sunrise: today.sunrise,
      sunset: today.sunset,
      solarNoon: solarTimes.solarNoon,
      dayLength: dayLengthMins,
      goldenHourMorningEnd: solarTimes.goldenHourMorningEnd,
      goldenHourEveningStart: solarTimes.goldenHourEveningStart,
      blueHourMorningStart: solarTimes.blueHourMorningStart,
      blueHourEveningEnd: solarTimes.blueHourEveningEnd,
      currentPosition: sunArcPos,
    },
    moon: {
      phase: moonPhase.phase,
      phaseName: moonPhase.phaseName,
      illumination: moonPhase.illumination,
      moonrise: null, // Open-Meteo doesn't provide moonrise/set in free tier
      moonset: null,
      nextFullMoon: moonPhase.nextFullMoon,
      nextNewMoon: moonPhase.nextNewMoon,
    },
    astronomy: {
      nextSolstice: isSolstice
        ? { date: nextEvent.date, type: nextEvent.type === 'summer-solstice' ? 'summer' : 'winter' }
        : { date: afterNext.date, type: afterNext.type === 'summer-solstice' ? 'summer' : 'winter' },
      nextEquinox: isEquinox
        ? { date: nextEvent.date, type: nextEvent.type === 'spring-equinox' ? 'spring' : 'autumn' }
        : { date: afterNext.date, type: afterNext.type === 'spring-equinox' ? 'spring' : 'autumn' },
      currentSeason: season,
      daysRemainingInSeason: daysRemaining,
      dayLengthTrend: dayLengthChangeTodayMins >= 0 ? 'increasing' : 'decreasing',
      dayLengthChangeTodayMinutes: Math.abs(dayLengthChangeTodayMins),
    },
    fetchedAt: new Date().toISOString(),
  };
}

function parseCurrent(raw: Record<string, unknown>): CurrentWeather {
  const c = raw.current as Record<string, unknown>;
  const units = raw.current_units as Record<string, string>;
  const code = Number(c.weather_code ?? 0);

  return {
    temperature: Number(c.temperature_2m ?? 0),
    feelsLike: Number(c.apparent_temperature ?? 0),
    humidity: Number(c.relative_humidity_2m ?? 0),
    dewPoint: Number(c.dew_point_2m ?? 0),
    windSpeed: Number(c.wind_speed_10m ?? 0),
    windGusts: Number(c.wind_gusts_10m ?? 0),
    windDirection: Number(c.wind_direction_10m ?? 0),
    pressure: Number(c.surface_pressure ?? 0),
    visibility: Number(c.visibility ?? 0) / 1000, // m -> km
    uvIndex: Number(c.uv_index ?? 0),
    weatherCode: code,
    isDay: Boolean(c.is_day),
    precipitation: Number(c.precipitation ?? 0),
    precipitationType: getPrecipType(code),
    cloudCover: Number(c.cloud_cover ?? 0),
  };
}

function parseHourly(raw: Record<string, unknown>): HourlyForecast[] {
  const h = raw.hourly as Record<string, unknown[]>;
  const times = h.time as string[];
  if (!times) return [];

  return times.map((time, i) => ({
    time,
    temperature: Number(h.temperature_2m[i] ?? 0),
    feelsLike: Number(h.apparent_temperature[i] ?? 0),
    humidity: Number(h.relative_humidity_2m[i] ?? 0),
    dewPoint: Number(h.dew_point_2m[i] ?? 0),
    precipitationProbability: Number(h.precipitation_probability[i] ?? 0),
    precipitation: Number(h.precipitation[i] ?? 0),
    weatherCode: Number(h.weather_code[i] ?? 0),
    windSpeed: Number(h.wind_speed_10m[i] ?? 0),
    windDirection: Number(h.wind_direction_10m[i] ?? 0),
    windGusts: Number(h.wind_gusts_10m[i] ?? 0),
    uvIndex: Number(h.uv_index[i] ?? 0),
    isDay: Boolean(h.is_day[i]),
    visibility: Number(h.visibility[i] ?? 0) / 1000,
    pressure: Number(h.surface_pressure[i] ?? 0),
  }));
}

function parseDaily(raw: Record<string, unknown>): DailyForecast[] {
  const d = raw.daily as Record<string, unknown[]>;
  const dates = d.time as string[];
  if (!dates) return [];

  return dates.map((date, i) => ({
    date,
    tempMax: Number(d.temperature_2m_max[i] ?? 0),
    tempMin: Number(d.temperature_2m_min[i] ?? 0),
    weatherCode: Number(d.weather_code[i] ?? 0),
    precipitationProbability: Number(d.precipitation_probability_max[i] ?? 0),
    precipitation: Number(d.precipitation_sum[i] ?? 0),
    windSpeedMax: Number(d.wind_speed_10m_max[i] ?? 0),
    windGustsMax: Number(d.wind_gusts_10m_max[i] ?? 0),
    windDirectionDominant: Number(d.wind_direction_10m_dominant[i] ?? 0),
    uvIndexMax: Number(d.uv_index_max[i] ?? 0),
    sunrise: String(d.sunrise[i] ?? ''),
    sunset: String(d.sunset[i] ?? ''),
    precipitationHours: Number(d.precipitation_hours[i] ?? 0),
    shortwaveRadiation: Number(d.shortwave_radiation_sum[i] ?? 0),
  }));
}

function parseAirQuality(raw: Record<string, unknown>): AirQuality {
  const h = raw.hourly as Record<string, unknown[]>;
  // Get the first non-null value for current hour
  const getFirst = (key: string) => {
    const arr = h[key] as (number | null)[];
    return arr?.find(v => v !== null) ?? 0;
  };

  const pm25 = getFirst('pm2_5');
  const pm10 = getFirst('pm10');
  const no2 = getFirst('nitrogen_dioxide');
  const o3 = getFirst('ozone');
  const so2 = getFirst('sulphur_dioxide');
  const aqi = getFirst('european_aqi');

  let dominantPollutant = 'PM2.5';
  const vals: [string, number][] = [['PM2.5', pm25], ['PM10', pm10], ['NO₂', no2], ['O₃', o3], ['SO₂', so2]];
  let maxVal = 0;
  for (const [name, val] of vals) {
    if (val > maxVal) { maxVal = val; dominantPollutant = name; }
  }

  const getCategory = (a: number): AirQuality['category'] => {
    if (a <= 20) return 'Good';
    if (a <= 40) return 'Fair';
    if (a <= 60) return 'Moderate';
    if (a <= 80) return 'Poor';
    return 'Very Poor';
  };

  return { aqi, pm25, pm10, no2, o3, so2, dominantPollutant, category: getCategory(aqi) };
}

function getPrecipType(code: number): CurrentWeather['precipitationType'] {
  if (code === 0 || code === 1 || code === 2 || code === 3) return 'none';
  if (code >= 45 && code <= 48) return 'none'; // fog
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 85 && code <= 86) return 'snow';
  if (code === 66 || code === 67) return 'sleet';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 95) return 'rain';
  return 'none';
}

// Geocoding search
export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
  timezone: string;
}

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}
