import type {
  WeatherData,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  AirQualityData,
  LocationInfo,
  GeocodingResult,
  Coordinates,
} from "@/types/weather";

const BASE_URL = "https://api.open-meteo.com/v1";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1";
const AQ_URL = "https://air-quality-api.open-meteo.com/v1";

export async function fetchWeatherData(
  coords: Coordinates,
  location: LocationInfo
): Promise<WeatherData> {
  const { latitude, longitude } = coords;

  const weatherParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "surface_pressure",
      "visibility",
      "dew_point_2m",
      "uv_index",
      "precipitation",
      "cloud_cover",
      "is_day",
    ].join(","),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "weather_code",
      "precipitation_probability",
      "precipitation",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "relative_humidity_2m",
      "surface_pressure",
      "uv_index",
      "visibility",
      "dew_point_2m",
      "cloud_cover",
      "is_day",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "sunrise",
      "sunset",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "wind_direction_10m_dominant",
      "uv_index_max",
      "precipitation_hours",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
    wind_speed_unit: "kmh",
    temperature_unit: "celsius",
  });

  const [weatherRes, aqRes] = await Promise.allSettled([
    fetch(`${BASE_URL}/forecast?${weatherParams}`),
    fetch(
      `${AQ_URL}/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,us_aqi,pm10,pm2_5&hourly=european_aqi,us_aqi,pm10,pm2_5&timezone=auto&forecast_days=1`
    ),
  ]);

  if (weatherRes.status === "rejected" || !weatherRes.value.ok) {
    throw new Error("Failed to fetch weather data");
  }

  const weatherData = await weatherRes.value.json();

  let airQuality: AirQualityData | null = null;
  if (aqRes.status === "fulfilled" && aqRes.value.ok) {
    const aqData = await aqRes.value.json();
    if (aqData.hourly) {
      airQuality = {
        time: aqData.hourly.time,
        pm2_5: aqData.hourly.pm2_5,
        pm10: aqData.hourly.pm10,
        europeanAqi: aqData.hourly.european_aqi,
        usAqi: aqData.hourly.us_aqi,
      };
    }
  }

  const current: CurrentWeather = {
    temperature: weatherData.current.temperature_2m,
    apparentTemperature: weatherData.current.apparent_temperature,
    humidity: weatherData.current.relative_humidity_2m,
    weatherCode: weatherData.current.weather_code,
    windSpeed: weatherData.current.wind_speed_10m,
    windDirection: weatherData.current.wind_direction_10m,
    windGusts: weatherData.current.wind_gusts_10m,
    pressure: weatherData.current.surface_pressure,
    visibility: weatherData.current.visibility,
    dewPoint: weatherData.current.dew_point_2m,
    uvIndex: weatherData.current.uv_index,
    precipitation: weatherData.current.precipitation,
    cloudCover: weatherData.current.cloud_cover,
    isDay: weatherData.current.is_day === 1,
    time: weatherData.current.time,
  };

  const hourly: HourlyForecast = {
    time: weatherData.hourly.time,
    temperature: weatherData.hourly.temperature_2m,
    apparentTemperature: weatherData.hourly.apparent_temperature,
    weatherCode: weatherData.hourly.weather_code,
    precipitationProbability: weatherData.hourly.precipitation_probability,
    precipitation: weatherData.hourly.precipitation,
    windSpeed: weatherData.hourly.wind_speed_10m,
    windDirection: weatherData.hourly.wind_direction_10m,
    windGusts: weatherData.hourly.wind_gusts_10m,
    humidity: weatherData.hourly.relative_humidity_2m,
    pressure: weatherData.hourly.surface_pressure,
    uvIndex: weatherData.hourly.uv_index,
    visibility: weatherData.hourly.visibility,
    dewPoint: weatherData.hourly.dew_point_2m,
    cloudCover: weatherData.hourly.cloud_cover,
    isDay: weatherData.hourly.is_day,
  };

  const daily: DailyForecast = {
    time: weatherData.daily.time,
    weatherCode: weatherData.daily.weather_code,
    temperatureMax: weatherData.daily.temperature_2m_max,
    temperatureMin: weatherData.daily.temperature_2m_min,
    apparentTemperatureMax: weatherData.daily.apparent_temperature_max,
    apparentTemperatureMin: weatherData.daily.apparent_temperature_min,
    sunrise: weatherData.daily.sunrise,
    sunset: weatherData.daily.sunset,
    precipitationSum: weatherData.daily.precipitation_sum,
    precipitationProbabilityMax: weatherData.daily.precipitation_probability_max,
    windSpeedMax: weatherData.daily.wind_speed_10m_max,
    windGustsMax: weatherData.daily.wind_gusts_10m_max,
    windDirectionDominant: weatherData.daily.wind_direction_10m_dominant,
    uvIndexMax: weatherData.daily.uv_index_max,
    precipitationHours: weatherData.daily.precipitation_hours,
  };

  return {
    current,
    hourly,
    daily,
    airQuality,
    location,
    fetchedAt: Date.now(),
  };
}

export async function geocodeSearch(
  query: string
): Promise<GeocodingResult[]> {
  const res = await fetch(
    `${GEO_URL}/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export async function reverseGeocode(
  coords: Coordinates
): Promise<LocationInfo> {
  // Open-Meteo doesn't have reverse geocoding, so we use a workaround:
  // Search for nearby locations using coordinates
  try {
    const res = await fetch(
      `${GEO_URL}/search?name=${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}&count=1&language=en&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.results?.length) {
        return {
          name: data.results[0].name,
          country: data.results[0].country,
          admin1: data.results[0].admin1,
          coordinates: coords,
        };
      }
    }
  } catch {
    // Fall through to default
  }

  return {
    name: "Current Location",
    country: "",
    coordinates: coords,
  };
}
