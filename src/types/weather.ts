export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  name: string;
  country: string;
  admin1?: string;
  coordinates: Coordinates;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  pressure: number;
  visibility: number;
  dewPoint: number;
  uvIndex: number;
  precipitation: number;
  cloudCover: number;
  isDay: boolean;
  time: string;
}

export interface HourlyForecast {
  time: string[];
  temperature: number[];
  apparentTemperature: number[];
  weatherCode: number[];
  precipitationProbability: number[];
  precipitation: number[];
  windSpeed: number[];
  windDirection: number[];
  windGusts: number[];
  humidity: number[];
  pressure: number[];
  uvIndex: number[];
  visibility: number[];
  dewPoint: number[];
  cloudCover: number[];
  isDay: number[];
}

export interface DailyForecast {
  time: string[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
  apparentTemperatureMax: number[];
  apparentTemperatureMin: number[];
  sunrise: string[];
  sunset: string[];
  precipitationSum: number[];
  precipitationProbabilityMax: number[];
  windSpeedMax: number[];
  windGustsMax: number[];
  windDirectionDominant: number[];
  uvIndexMax: number[];
  precipitationHours: number[];
}

export interface AirQualityData {
  time: string[];
  pm2_5: number[];
  pm10: number[];
  europeanAqi: number[];
  usAqi: number[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
  airQuality: AirQualityData | null;
  location: LocationInfo;
  fetchedAt: number;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  country_code: string;
}

export type WeatherCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm"
  | "unknown";
